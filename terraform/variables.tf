variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "key_name" {
  description = "SSH key pair name"
  type        = string
  default     = "rh-matt"
}

variable "vpc_id" {
  description = "Staging VPC ID"
  type        = string
  default     = "vpc-0effac4e38fb68976"
}

variable "subnet_id" {
  description = "Public subnet in staging VPC"
  type        = string
  default     = "subnet-0f21ceecec2bc199e"
}
