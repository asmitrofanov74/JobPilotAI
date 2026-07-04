# RDS Aurora PostgreSQL
resource "aws_rds_cluster" "main" {
  cluster_identifier      = "${var.environment}-jobpilot-aurora"
  engine                  = "aurora-postgresql"
  engine_mode             = "serverless"
  engine_version          = "16.4"
  database_name           = "jobpilot"
  master_username         = "jobpilot"
  master_password         = var.db_password
  port                    = 5432
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.rds.id]
  storage_encrypted       = true
  backup_retention_period = 7
  deletion_protection     = var.environment == "prod"

  serverlessv2_scaling_configuration {
    min_capacity = 0.5
    max_capacity = 128
  }
}

resource "aws_rds_cluster_instance" "main" {
  count              = 2
  identifier         = "${var.environment}-jobpilot-aurora-${count.index}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.main.engine
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-jobpilot-subnet-group"
  subnet_ids = aws_subnet.private_data[*].id
}

# ElastiCache Redis
resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${var.environment}-jobpilot-redis"
  description          = "Redis for JobPilot AI"
  node_type            = "cache.t4g.small"
  port                 = 6379
  parameter_group_name = "default.redis7"
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
  automatic_failover_enabled = false
  num_cache_clusters         = 1
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.environment}-jobpilot-redis-subnet"
  subnet_ids = aws_subnet.private_data[*].id
}

# Secrets Manager
resource "aws_secretsmanager_secret" "jwt" {
  name = "${var.environment}-jwt-secret"
}

resource "aws_secretsmanager_secret" "jwt_refresh" {
  name = "${var.environment}-jwt-refresh-secret"
}

resource "aws_secretsmanager_secret" "openai" {
  name = "${var.environment}-openai-api-key"
}
