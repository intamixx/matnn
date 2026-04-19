#cloud-config
package_update: true
package_upgrade: true

packages:
  - nginx

write_files:
  - path: /var/www/html/index.html
    content: |
      <html>
      <h1>Hello World!</h1>
      <p>This VM is provisioned.</p>
      </html>

runcmd:
  - systemctl enable nginx
  - systemctl start nginx
