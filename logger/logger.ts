// import bunyan from 'bunyan';

// // Imports the Google Cloud client library for Bunyan
// import { LoggingBunyan } from '@google-cloud/logging-bunyan';

// // Creates a Bunyan Cloud Logging client
// const loggingBunyan = new LoggingBunyan({
//   projectId: 'karakuri-dev',
// });

// // Create a Bunyan logger that streams to Cloud Logging
// // Logs will be written to: "projects/YOUR_PROJECT_ID/logs/bunyan_log"
// export const logger = bunyan.createLogger({
//   // The JSON payload of the log as it appears in Cloud Logging
//   // will contain "name": "my-service"
//   name: 'chatgpt',
//   streams: [
//     // Log to the console at 'info' and above
//     // { stream: process.stdout, level: 'info' },
//     // And log to Cloud Logging, logging at 'info' and above
//     loggingBunyan.stream('info'),
//   ],
// });

// // Writes some log entries
// logger.error('warp nacelles offline');
// logger.info('shields at 99%');

export const logger = {
  ...console,
  info: (...args: unknown[]) =>
    console.info(...args.map((arg) => JSON.stringify(arg))),
};
