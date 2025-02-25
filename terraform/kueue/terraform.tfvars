nodes = {
        node1 : {
                role : ["controlplane", "worker", "etcd"]
                address : "40.118.87.219"
                internal_address : "10.123.1.5"
                ssh_key : "~/.ssh/id_rsa"
                user : "root"
        },
        node2 : {
                role : ["worker", "etcd"]
                address : "40.118.80.97"
                internal_address : "10.123.1.4"
                ssh_key : "~/.ssh/id_rsa"
                user : "root"
        },
}
