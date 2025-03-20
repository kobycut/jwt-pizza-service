const config = require("./config");

const requests = {};
const successfulLoginRequests = {};
const successfulPurchaseRequests = {};
const cpu_values = [];
const memory_values = [];
const pizzaLatencyValues = [];
const requestLatency = [];
const priceValues = [];

function track(endpoint) {
  return (req, res, next) => {
    requests[endpoint] = (requests[endpoint] || 0) + 1;
    next();
  };
}
function trackPizzaLatency(latency) {
  pizzaLatencyValues.push(latency);

  const pizzaLatency = "pizzaLatency";
  sendMetricToGrafana(
    "pizzaLatency",
    pizzaLatencyValues[pizzaLatencyValues.length - 1],
    { pizzaLatency }
  );
}

function trackPrice(price) {
  console.log(price);
  priceValues.push(price);
  const priceValue = "priceValue";
  sendMetricToGrafana("price", priceValues[priceValues.length - 1], {
    priceValue,
  });
}

function trackRequestLatency(latency) {
  requestLatency.push(latency);
  const latencyRequest = "latency";
  sendMetricToGrafana(
    "request_latency",
    requestLatency[requestLatency.length - 1],
    { latencyRequest }
  );
}

function trackSuccessLogins(endpoint) {
  successfulLoginRequests[endpoint] =
    (successfulLoginRequests[endpoint] || 0) + 1;
}

function trackSuccessPurchases(endpoint) {
  successfulPurchaseRequests[endpoint] =
    (successfulPurchaseRequests[endpoint] || 0) + 1;
}

function updateCpuMemory(cpu_usage, memory_usage) {
  cpu_values.push(cpu_usage);
  memory_values.push(memory_usage);
}

// This will periodically send metrics to Grafana
const timer = setInterval(() => {
  // cpu and memory usage send to grafana
  let cpu_usage = getCpuUsagePercentage();
  let memory_usage = getMemoryUsagePercentage();
  const memory = "memory_usage";
  const cpu = "cpu_usage";

  updateCpuMemory(cpu_usage, memory_usage);
  sendMetricToGrafana(
    "memory_usage",
    parseInt(memory_values[memory_values.length - 1]),
    { memory }
  );
  sendMetricToGrafana(
    "cpu_usage",
    parseInt(cpu_values[cpu_values.length - 1]),
    { cpu }
  );

  Object.keys(requests).forEach((endpoint) => {
    console.log(endpoint);
    sendMetricToGrafana("requests", requests[endpoint], { endpoint });
  });
  Object.keys(successfulLoginRequests).forEach((endpoint) => {
    console.log(endpoint);
    sendMetricToGrafana("requests", successfulLoginRequests[endpoint], {
      endpoint,
    });
  });
  Object.keys(successfulPurchaseRequests).forEach((endpoint) => {
    console.log(endpoint);
    sendMetricToGrafana("requests", successfulPurchaseRequests[endpoint], {
      endpoint,
    });
  });
}, 10000);

function sendMetricToGrafana(metricName, metricValue, attributes) {
  attributes = { ...attributes, source: config.metrics.source };

  const metric = {
    resourceMetrics: [
      {
        scopeMetrics: [
          {
            metrics: [
              {
                name: metricName,
                unit: "1",
                sum: {
                  dataPoints: [
                    {
                      asDouble: metricValue,
                      timeUnixNano: Date.now() * 1000000,
                      attributes: [],
                    },
                  ],
                  aggregationTemporality: "AGGREGATION_TEMPORALITY_CUMULATIVE",
                  isMonotonic: true,
                },
              },
            ],
          },
        ],
      },
    ],
  };

  Object.keys(attributes).forEach((key) => {
    metric.resourceMetrics[0].scopeMetrics[0].metrics[0].sum.dataPoints[0].attributes.push(
      {
        key: key,
        value: { stringValue: attributes[key] },
      }
    );
  });
  console.table(config.metrics);
  fetch(`${config.metrics.url}`, {
    method: "POST",
    body: JSON.stringify(metric),
    headers: {
      Authorization: `Bearer ${config.metrics.apiKey}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        console.error("Failed to push metrics data to Grafana");
        console.error(response);
      } else {
        console.log(`Pushed ${metricName}`);
      }
    })
    .catch((error) => {
      console.error("Error pushing metrics:", error);
    });
}

const os = require("os");

function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  return cpuUsage.toFixed(2) * 100;
}

function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(0);
}
module.exports = {
  track,
  trackSuccessLogins,
  trackSuccessPurchases,
  trackPizzaLatency,
  trackRequestLatency,
  trackPrice,
};
