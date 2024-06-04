import { createWebHistory, createRouter } from 'vue-router'
import Home from '../components/Home'
import Status from "../components/Status"
import Result from "../components/Result"

//import VueRouter from 'vue-router';

const routes = [
    {
        path: "/",
        component: Home,
    },
    {
        path: "/predict",
        component: Home,
    },
    {
        name: "Status",
        path: "/status/:id",
        component: Status,
        //component: () => import('../components/Status.vue'),
        //props: true
    },
    {
        name: "Result",
        path: "/result/:id",
        component: Result,
        //component: () => import('../components/Result.vue'),
        //props: true
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
