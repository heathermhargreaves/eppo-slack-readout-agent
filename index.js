/**
 * Slack Bot for Eppo Experiment Results
 * 
 * Required Environment Variables:
 * - SLACK_BOT_TOKEN: Your Slack bot token (xoxb-...)
 * - SLACK_SIGNING_SECRET: Your Slack app signing secret
 * - EPPO_API_URL: Eppo API base URL (https://api.geteppo.com/api/v1/experiments)
 * - EPPO_API_TOKEN: Your Eppo API token
 */

const { App } = require('@slack/bolt');
const axios = require('axios');
require('dotenv').config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Function to handle experiment lookup and display results
async function handleExperimentLookup(fullExperimentId, say) {
  const numericId = fullExperimentId.replace(/^EXP-/, '');
  
  await say(`Looking up ${fullExperimentId}...`);
  
  try {
    const eppoUrl = `${process.env.EPPO_API_URL}/${numericId}?with_calculated_metrics=true&with_full_cuped_data=true`;
    const headers = { 'X-Eppo-Token': process.env.EPPO_API_TOKEN };
    
    const res = await axios.get(eppoUrl, { headers });
    const experiment = res.data;
    const { variations } = experiment;

    if (!variations?.length) {
      await say(`No variations found for *${fullExperimentId}*.`);
      return;
    }

    // Get all unique metric IDs
    const allMetricIds = new Set();
    variations.forEach(variation => {
      variation.calculated_metrics?.forEach(metric => {
        allMetricIds.add(metric.metric_id);
      });
    });

    if (allMetricIds.size === 0) {
      await say(`No calculated metrics found for *${fullExperimentId}*.`);
      return;
    }

    // Fetch metric names
    const metricNames = {};
    const baseMetricsUrl = process.env.EPPO_API_URL.replace('/experiments', '/metrics');
    
    for (const metricId of allMetricIds) {
      try {
        const metricRes = await axios.get(`${baseMetricsUrl}/${metricId}`, { headers });
        metricNames[metricId] = metricRes.data.name || `Metric ${metricId}`;
      } catch (e) {
        metricNames[metricId] = `Metric ${metricId}`;
      }
    }

    // Check if we have CUPED results
    let hasCupedResults = false;
    variations.forEach(variation => {
      variation.calculated_metrics?.forEach(metric => {
        if (metric.cuped && metric.cuped.percent_change !== undefined) {
          hasCupedResults = true;
        }
      });
    });

    // Build response
    let responseLines = [`📊 *<https://eppo.cloud/experiments/${numericId}|${fullExperimentId}>* results:`];
    responseLines.push(hasCupedResults ? `_Using CUPED results_\n` : `_Using non-CUPED results_\n`);
    
    allMetricIds.forEach(metricId => {
      responseLines.push(`\n*${metricNames[metricId]}*:`);
      
      variations.forEach(variation => {
        if (variation.is_control) return; // Skip control
        
        const metric = variation.calculated_metrics?.find(m => m.metric_id === metricId);
        if (!metric) return;

        // Use CUPED results if available
        let percentChange, ciLower, ciUpper, pValue;
        if (hasCupedResults && metric.cuped) {
          percentChange = metric.cuped.percent_change;
          ciLower = metric.cuped.confidence_interval?.lower_bound;
          ciUpper = metric.cuped.confidence_interval?.upper_bound;
          pValue = metric.cuped.p_value;
        } else {
          percentChange = metric.percent_change;
          ciLower = metric.confidence_interval?.lower_bound;
          ciUpper = metric.confidence_interval?.upper_bound;
          pValue = metric.p_value;
        }
        
        const lift = percentChange !== undefined ? (percentChange * 100) : 'N/A';
        const isStatSig = metric.statistically_significant;

        // Status emoji
        let emoji = '⚪';
        if (isStatSig && typeof lift === 'number') {
          emoji = lift > 0 ? '🟢' : '🔴';
        }

        const liftFormatted = typeof lift === 'number' ? `${lift.toFixed(2)}%` : lift;
        const ciLowerFormatted = typeof ciLower === 'number' ? `${(ciLower * 100).toFixed(2)}%` : 'N/A';
        const ciUpperFormatted = typeof ciUpper === 'number' ? `${(ciUpper * 100).toFixed(2)}%` : 'N/A';
        const pValueFormatted = typeof pValue === 'number' ? pValue.toFixed(4) : pValue;
        
        responseLines.push(`  ${emoji} *${variation.name}*: ${liftFormatted} lift [${ciLowerFormatted}, ${ciUpperFormatted}] (p=${pValueFormatted})`);
      });
    });
    
    await say(responseLines.join('\n'));
  } catch (e) {
    await say(`Failed to fetch results for *${fullExperimentId}* (${e.message})`);
  }
}

// Handler for app mentions
app.event('app_mention', async ({ event, say }) => {
  const match = event.text.match(/EXP-[A-Za-z0-9_-]+/);
  if (match) {
    await handleExperimentLookup(match[0], say);
  } else {
    await say(`Hi! I can help you get experiment results. Mention me with an experiment ID like: @bot EXP-12345`);
  }
});

// Handler for direct messages with experiment IDs
app.message(/EXP-[A-Za-z0-9_-]+/, async ({ message, say }) => {
  if (message.text.includes('<@')) return; // Skip mentions
  
  const match = message.text.match(/EXP-[A-Za-z0-9_-]+/);
  if (match) {
    await handleExperimentLookup(match[0], say);
  }
});

// Start the app
(async () => {
  try {
    await app.start(3000);
    console.log('⚡️ Slack app is running on port 3000!');
  } catch (error) {
    console.error('Failed to start Slack app:', error);
  }
})();
