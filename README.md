
# Kubernetes challenge

Deploy this [application](https://github.com/learnk8s/kubernetes-challenge) to [Minikube](https://github.com/kubernetes/minikube) and customize the environment variable to display your name.

```
$ curl $(minikube ip)
Hello Dan!
```

### Instructions

- Fork this repo
- Build the Docker image
- Write yaml files for a deployment, service, ingress and configmap
- Deploy your application to Minikube
- You should be able to `curl` Minikube's ip and retrieve the string `Hello {yourname}!`
- Commit your files to Github

### Notes

There's no need to push the Docker image to a Docker registry. You should be able to build and use the image from within Minikube.

You can expose Minikube's Docker daemon with:

```shell
$ eval (minkube docker-env)
```

## Infrastructure setup

### Prerequisites

- [Docker](https://docs.docker.com/engine/install/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/?arch=%2Flinux%2Fx86-64%2Fstable%2Fbinary+download])

### The kubernetes cluster

#### Start minikube cluster with 3 nodes.

```shell
minikube start --nodes 3 --addons=ingress,registry,metrics-server,dashboard
```

Verify the nodes in the cluster are ready with `kubectl get nodes`

```
NAME           STATUS   ROLES           AGE    VERSION
minikube       Ready    control-plane   2m7s   v1.31.0
minikube-m02   Ready    <none>          32s    v1.31.0
minikube-m03   Ready    <none>          22s    v1.31.0
```

#### Convert the nodes in the cluster to 1 control-plane and 2 worker nodes.

Label the worker nodes

```shell
kubectl label node minikube-m02 node-role.kubernetes.io/worker=worker
kubectl label node minikube-m03 node-role.kubernetes.io/worker=worker
```

The output from `kubectl get nodes` should now have ROLES set.

```
NAME           STATUS   ROLES           AGE     VERSION
minikube       Ready    control-plane   4m26s   v1.31.0
minikube-m02   Ready    worker          2m51s   v1.31.0
minikube-m03   Ready    worker          2m41s   v1.31.0
```

Taint the control-plane node to restrict deployments to the worker nodes only.

```shell
kubectl taint nodes minikube node-role.kubernetes.io/master:NoSchedule
```

#### The docker registry

The challenge specified

> Build the Docker image
There's no need to push the Docker image to a Docker registry. You should be able to build and use the image from within Minikube.
You can expose Minikube's Docker daemon with:

```shell
$ eval (minkube docker-env)
```

However, this isn't supported on a multi node minikube cluster. 

```
❌  Exiting due to ENV_MULTINODE_CONFLICT: The docker-env command is incompatible with multi-node clusters. Use the 'registry' add-on: https://minikube.sigs.k8s.io/docs/handbook/registry/
```

Instead we will use the minikube registry addon which was enabled in the initial setup and expose it to the host with a proxy service as described in the [documentation](https://minikube.sigs.k8s.io/docs/handbook/registry/).

```shell
docker run -d --rm --name=registry_proxy --network=host alpine ash -c "apk add socat && socat TCP-LISTEN:5000,reuseaddr,fork TCP:$(minikube ip):5000"
```

## Application

#### Build and push the application image to the local registry

```shell
docker build -t localhost:5000/myapp:v1 .
docker push localhost:5000/myapp:v1
```

#### Deploy the application to kubernetes(minikube)

```shell
kubectl create -f myapp.yaml
```

The ouput from the above command should look like this.

```
namespace/myapp created
resourcequota/myapp created
limitrange/myapp created
networkpolicy.networking.k8s.io/myapp created
configmap/myapp created
deployment.apps/myapp created
horizontalpodautoscaler.autoscaling/myapp created
service/myapp created
ingress.networking.k8s.io/myapp created
```

Verify the deployment has 2/2 Ready with `kubectl -n myapp get deployment myapp`

```
NAME    READY   UP-TO-DATE   AVAILABLE   AGE
myapp   2/2     2            2           108s
```

Verify the application is accessible and loadbalancing via the ingress service with `curl $(minikube ip)`

```
$ curl $(minikube ip)
Hello PickleRick! From myapp-f4f69795b-dnw85 on minikube-m02

$ curl $(minikube ip)
Hello PickleRick! From myapp-f4f69795b-2lfz5 on minikube-m03
```

### Troubleshooting

Review `kubectl -n myapp get events` and `kubectl -n myapp describe deployment myapp` for clues.

### Remove everything.

Remove minikube

```
minikube delete
```

Remove the registry proxy

```
docker stop registry_proxy
```

### KubeLinter (optional)

Validate your kubernetes yaml files with [KubeLinter](https://docs.kubelinter.io/#/?id=installing-kubelinter).

```shell
kube-linter lint myapp.yaml
```

example (good) output

```
KubeLinter 0.7.1

No lint errors found!
```

### Taskfile (optional)

- [https://taskfile.dev/](https://taskfile.dev/)

Review the Taskfile.yaml file.

Start from scratch. Remove current deployment.

```shell
task infra-destroy
```

Create minikube infrastructure and deploy myapp

```shell
task myapp-init
```

### Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [learnk8s - Production best practices](https://learnk8s.io/production-best-practices)