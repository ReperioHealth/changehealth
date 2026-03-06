terraform {
  backend "s3" {
    bucket = "reperio-infrastructure-terraform"
    key    = "changehealth/terraform.tfstate"
    region = "us-west-2"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-west-2"

  default_tags {
    tags = {
      Project   = "changehealth"
      ManagedBy = "terraform"
    }
  }
}
