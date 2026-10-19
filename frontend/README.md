# CloudLab Monitor — AWS Student Activity Monitoring and Alert System

CloudLab Monitor is a cloud monitoring dashboard designed to help faculty review student cloud-lab activity, view service usage records, and receive alerts for activities that require attention.

## Features

- **Dashboard:** View cloud activity records and usage summaries.
- **Student Timeline:** Review activity by student and time.
- **Usage Alerts:** Identify records marked with alert-level statuses.
- **Reports:** View activity information and export available records as CSV.
- **Authentication:** User sign-in using Amazon Cognito.
- **Activity API:** Retrieve and submit activity records through Amazon API Gateway.
- **AWS Event Processing:** Process configured Amazon S3 activity events using AWS Lambda and store activity records in DynamoDB.
- **Email Notifications:** Send email alerts through Amazon SNS for configured high-priority activity statuses.

## Technology Stack

**Frontend**
- React
- Vite
- Material UI
- Recharts
- JavaScript

**AWS Services**
- Amazon Cognito
- Amazon API Gateway
- AWS Lambda
- Amazon DynamoDB
- AWS CloudTrail and Amazon EventBridge
- Amazon CloudWatch
- Amazon S3
- Amazon SNS

## Architecture Overview

1. Users sign in through Amazon Cognito.
2. The React dashboard communicates with the backend through Amazon API Gateway.
3. AWS Lambda processes API requests and saves activity records in DynamoDB.
4. Configured AWS events can trigger Lambda to process cloud activity records.
5. Amazon SNS sends email notifications when records meet the configured alert-status conditions.
6. The dashboard displays activity information and provides available reporting features.

## Run Locally

### Prerequisites

- Node.js and npm
- Git
- Access to the configured AWS resources for backend functionality

### Installation

Clone the repository:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd CloudLab-Monitor/frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal, usually `http://localhost:5173` or the port configured by Vite.

### Production Build

```bash
npm run build
```

The production files are generated in the `dist` directory.

## Project Status

This project is under development. The frontend production build has been tested, Cognito sign-in and API Gateway activity operations have been tested, and the configured S3 event-processing and SNS alert paths have been tested.

Some monitoring, reporting, authorization, and infrastructure-automation capabilities may require further implementation and validation. The project is not yet publicly deployed.

## Security Notes

- Never commit AWS access keys, secret keys, passwords, access tokens, or private environment files.
- Configure AWS permissions using least privilege.
- Use environment variables for configuration that should not be committed.
- Review authentication and authorization before using the application with real student data.

## Future Improvements

- Add Terraform-based infrastructure provisioning.
- Improve threshold-based activity analysis and monitoring.
- Expand reporting and faculty access controls.
- Optimize frontend bundle size.
- Deploy the application after completing security and configuration checks.

## Author

Developed as a cloud-monitoring project to explore AWS services, serverless application development, and cloud activity reporting.
