#!/usr/bin/env bash
set -euo pipefail

# Deploy the AWS Lambda + EventBridge schedule that hits the EC2 app.
#
# Prerequisites:
#   - AWS CLI configured
#   - SAM CLI installed (https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
#
# Usage:
#   export APP_BASE_URL="https://your-ec2-domain.com"
#   export FRANCHISE_PAYOUT_CRON_SECRET="replace-with-long-random-secret"
#   # optional:
#   # export AWS_REGION="ap-south-1"
#   # export STACK_NAME="mystatus-franchise-payout-cron"
#   # export SCHEDULE_EXPRESSION="cron(0 1 * * ? *)"   # 01:00 UTC
#   ./scripts/deploy-franchise-payout-cron.sh
#
# Also set the same FRANCHISE_PAYOUT_CRON_SECRET on the EC2 app env, then restart the app.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STACK_NAME="${STACK_NAME:-mystatus-franchise-payout-cron}"
AWS_REGION="${AWS_REGION:-ap-south-1}"
SCHEDULE_EXPRESSION="${SCHEDULE_EXPRESSION:-cron(0 1 * * ? *)}"

if [[ -z "${APP_BASE_URL:-}" ]]; then
  echo "ERROR: APP_BASE_URL is required (e.g. https://mystatus.example.com)" >&2
  exit 1
fi

if [[ -z "${FRANCHISE_PAYOUT_CRON_SECRET:-}" ]]; then
  echo "ERROR: FRANCHISE_PAYOUT_CRON_SECRET is required" >&2
  exit 1
fi

if ! command -v sam >/dev/null 2>&1; then
  echo "ERROR: AWS SAM CLI is not installed." >&2
  echo "Install: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html" >&2
  exit 1
fi

echo "Building/deploying stack '${STACK_NAME}' in ${AWS_REGION}..."
echo "Target app: ${APP_BASE_URL}/api/cron/franchise-payouts"
echo "Schedule:   ${SCHEDULE_EXPRESSION}"

sam deploy \
  --template-file "${ROOT_DIR}/infra/franchise-payout-cron.yaml" \
  --stack-name "${STACK_NAME}" \
  --region "${AWS_REGION}" \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset \
  --parameter-overrides \
    "AppBaseUrl=${APP_BASE_URL}" \
    "FranchisePayoutCronSecret=${FRANCHISE_PAYOUT_CRON_SECRET}" \
    "ScheduleExpression=${SCHEDULE_EXPRESSION}"

echo
echo "Deployed. Manual test:"
echo "  aws lambda invoke --region ${AWS_REGION} --function-name mystatus-franchise-payout-cron --cli-binary-format raw-in-base64-out --payload '{}' /tmp/franchise-payout-out.json && cat /tmp/franchise-payout-out.json"
echo
echo "Remember: set FRANCHISE_PAYOUT_CRON_SECRET on the EC2 app to the same value and restart the process."
