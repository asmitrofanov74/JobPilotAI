# Outputs

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "cloudfront_domain" {
  description = "CloudFront domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "ecr_api_repository" {
  description = "API ECR repository URL"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_web_repository" {
  description = "Web ECR repository URL"
  value       = aws_ecr_repository.web.repository_url
}

output "rds_endpoint" {
  description = "RDS cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "s3_documents_bucket" {
  description = "S3 documents bucket name"
  value       = aws_s3_bucket.documents.id
}
