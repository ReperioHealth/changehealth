locals {
  office_ip = "${data.aws_ssm_parameter.office_ip.value}/32"
  vpn_ip    = "${data.aws_ssm_parameter.vpn_elastic_ip.value}/32"
}

resource "aws_security_group" "changehealth" {
  name        = "changehealth"
  description = "Security group for ChangeHealth demo app"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP frontend from office/VPN"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [local.office_ip, local.vpn_ip]
  }

  ingress {
    description = "Backend API from office/VPN"
    from_port   = 9001
    to_port     = 9001
    protocol    = "tcp"
    cidr_blocks = [local.office_ip, local.vpn_ip]
  }

  ingress {
    description = "SSH from office/VPN"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [local.office_ip, local.vpn_ip]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "changehealth"
  }
}
