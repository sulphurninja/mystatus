# Deploy the AWS Lambda + EventBridge schedule that hits the EC2 app.
#
# Prerequisites:
#   - AWS CLI configured
#   - SAM CLI installed
#
# Usage (PowerShell):
#   $env:APP_BASE_URL = "https://your-ec2-domain.com"
#   $env:FRANCHISE_PAYOUT_CRON_SECRET = "replace-with-long-random-secret"
#   # optional:
#   # $env:AWS_REGION = "ap-south-1"
#   # $env:STACK_NAME = "mystatus-franchise-payout-cron"
#   # $env:SCHEDULE_EXPRESSION = "cron(0 1 * * ? *)"
#   .\scripts\deploy-franchise-payout-cron.ps1

$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$StackName = if ($env:STACK_NAME) { $env:STACK_NAME } else { "mystatus-franchise-payout-cron" }
$AwsRegion = if ($env:AWS_REGION) { $env:AWS_REGION } else { "ap-south-1" }
$ScheduleExpression = if ($env:SCHEDULE_EXPRESSION) { $env:SCHEDULE_EXPRESSION } else { "cron(0 1 * * ? *)" }

if (-not $env:APP_BASE_URL) {
  Write-Error "APP_BASE_URL is required (e.g. https://mystatus.example.com)"
}
if (-not $env:FRANCHISE_PAYOUT_CRON_SECRET) {
  Write-Error "FRANCHISE_PAYOUT_CRON_SECRET is required"
}
if (-not (Get-Command sam -ErrorAction SilentlyContinue)) {
  Write-Error "AWS SAM CLI is not installed. See https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
}

Write-Host "Building/deploying stack '$StackName' in $AwsRegion..."
Write-Host "Target app: $($env:APP_BASE_URL)/api/cron/franchise-payouts"
Write-Host "Schedule:   $ScheduleExpression"

sam deploy `
  --template-file (Join-Path $RootDir "infra\franchise-payout-cron.yaml") `
  --stack-name $StackName `
  --region $AwsRegion `
  --capabilities CAPABILITY_IAM `
  --resolve-s3 `
  --no-confirm-changeset `
  --no-fail-on-empty-changeset `
  --parameter-overrides `
    "AppBaseUrl=$($env:APP_BASE_URL)" `
    "FranchisePayoutCronSecret=$($env:FRANCHISE_PAYOUT_CRON_SECRET)" `
    "ScheduleExpression=$ScheduleExpression"

Write-Host ""
Write-Host "Deployed. Manual test:"
Write-Host "  aws lambda invoke --region $AwsRegion --function-name mystatus-franchise-payout-cron --cli-binary-format raw-in-base64-out --payload '{}' payout-out.json; Get-Content payout-out.json"
Write-Host ""
Write-Host "Remember: set FRANCHISE_PAYOUT_CRON_SECRET on the EC2 app to the same value and restart the process."
