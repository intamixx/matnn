https://medium.com/@michamarszaek/skaffold-a-new-way-for-deploying-applications-to-k8s-clusters-f8ed4f2539a9
https://oneuptime.com/blog/post/2026-03-06-use-flux-cd-skaffold-development-workflow/view

curl -s https://fluxcd.io/install.sh | sudo bash
flux
flux check --pre
flux bootstrap github
flux bootstrap github   --owner=intamixx   --repository=yd   --branch=main   --path=clusters/dev
flux version
flux check
flux get all -A
kubectl get pods -n flux-system

flux get kustomizations -A

curl -LO https://github.com/GoogleContainerTools/container-structure-test/releases/latest/download/container-structure-test-linux-amd64
chmod +x container-structure-test-linux-amd64
mv container-structure-test-linux-amd64 /usr/local/bin/container-structure-test

skaffold init
skaffold dev
skaffold build --file-output=artifacts.json
skaffold test --build-artifacts artifacts.json

 2515  cat tests/structure-test.yaml
 2516  skaffold test --build-artifacts artifacts.json
