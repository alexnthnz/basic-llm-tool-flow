# Use data sources to get common information about the environment
data "aws_caller_identity" "this" {}
data "aws_partition" "this" {}
data "aws_region" "this" {}

data "aws_bedrock_foundation_model" "kb" {
  model_id = var.kb_model_id
}
