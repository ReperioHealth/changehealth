data "aws_ssm_parameter" "office_ip" {
  name = "/shared/office/ip"
}

data "aws_ssm_parameter" "vpn_elastic_ip" {
  name = "/shared/vpn/elastic-ip"
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
