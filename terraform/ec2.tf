resource "aws_instance" "changehealth" {
  ami                         = data.aws_ami.amazon_linux.id
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = [aws_security_group.changehealth.id]
  key_name                    = var.key_name
  associate_public_ip_address = true

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = <<-EOF
    #!/bin/bash
    set -e

    # Install Docker
    dnf install -y docker git
    systemctl start docker
    systemctl enable docker
    usermod -aG docker ec2-user

    # Install Docker Compose plugin
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

    # Upgrade Docker Buildx (Compose requires >= 0.17.0)
    curl -SL "https://github.com/docker/buildx/releases/download/v0.21.2/buildx-v0.21.2.linux-amd64" \
      -o /usr/libexec/docker/cli-plugins/docker-buildx
    chmod +x /usr/libexec/docker/cli-plugins/docker-buildx

    # Create app directory
    mkdir -p /opt/changehealth
    chown ec2-user:ec2-user /opt/changehealth
  EOF

  tags = {
    Name = "changehealth"
  }
}

resource "aws_eip" "changehealth" {
  domain = "vpc"

  tags = {
    Name = "changehealth"
  }
}

resource "aws_eip_association" "changehealth" {
  instance_id   = aws_instance.changehealth.id
  allocation_id = aws_eip.changehealth.id
}
