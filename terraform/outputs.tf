output "public_ip" {
  description = "Elastic IP address"
  value       = aws_eip.changehealth.public_ip
}

output "url" {
  description = "Application URL"
  value       = "http://changehealth.reperiohealth.com"
}

output "ssh_command" {
  description = "SSH command to connect"
  value       = "ssh -i ~/.ssh/rh-matt.pem ec2-user@${aws_eip.changehealth.public_ip}"
}
