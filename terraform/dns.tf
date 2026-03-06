resource "aws_route53_record" "changehealth" {
  zone_id = "Z08555902RHMO0A7FAOQZ"
  name    = "changehealth.reperiohealth.com"
  type    = "A"
  ttl     = 300
  records = [aws_eip.changehealth.public_ip]
}
