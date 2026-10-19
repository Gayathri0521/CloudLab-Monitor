# ☁️ CloudLab Monitor
### AWS Student Activity Monitoring and Alert System

CloudLab Monitor is a cloud monitoring dashboard designed to help faculty review student cloud-lab activity, understand AWS service usage, and receive alerts for activities requiring attention.

## ✨ Features

- 📊 **Dashboard:** View cloud activity records and usage summaries.
- 👨‍🎓 **Student Timeline:** Review student activity by time.
- 🚨 **Usage Alerts:** View records marked with alert-level statuses.
- 📑 **Reports:** Review activity information and export records as CSV.
- 🔐 **Authentication:** User sign-in using Amazon Cognito.
- 🔗 **REST API:** Retrieve and submit activity records through Amazon API Gateway.
- ⚙️ **Serverless Processing:** Process configured AWS events using AWS Lambda.
- 🗄️ **Activity Storage:** Store activity records in Amazon DynamoDB.
- 📧 **Email Notifications:** Send alerts through Amazon SNS for configured high-priority statuses.

## 🛠️ Technology Stack

### Frontend
- React
- Vite
- Material UI
- Recharts
- JavaScript

### AWS Services
- Amazon Cognito
- Amazon API Gateway
- AWS Lambda
- Amazon DynamoDB
- AWS CloudTrail
- Amazon EventBridge
- Amazon CloudWatch
- Amazon S3
- Amazon SNS

## 🏗️ Architecture

1. Users sign in through Amazon Cognito.
2. The React dashboard communicates with the backend through Amazon API Gateway.
3. AWS Lambda processes requests and stores activity records in DynamoDB.
4. Configured AWS events can trigger Lambda to process cloud activity records.
5. Amazon SNS sends email notifications when records meet configured alert-status conditions.
6. The dashboard displays activity information and provides reporting features.

## 🚀 Run Locally

### Prerequisites
- Node.js
- npm
- Git


```bash
git clone https://github.com/Gayathri0521/CloudLab-Monitor.git
cd CloudLab-Monitor/frontend
