# JobPilot AI — Terraform Infrastructure
#
# Deploy: cd infrastructure/terraform && terraform init && terraform apply
#
# State: s3://jobpilot-terraform-state (configure backend first)

terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  backend "s3" {
    bucket         = "jobpilot-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "ca-central-1"
    encrypt        = true
    dynamodb_table = "jobpilot-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "JobPilotAI"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
