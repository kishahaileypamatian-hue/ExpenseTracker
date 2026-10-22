import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabase'

import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'

import AppLayout from '../layouts/AppLayout.vue'
import HomeView from '../views/HomeView.vue'
import TransactionsView from '../views/TransactionsView.vue'
import ManageView from '../views/ManageView.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      guestOnly: true,
    },
  },

  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: {
      guestOnly: true,
    },
  },

  {
    path: '/',
    component: AppLayout,
    meta: {
      requiresAuth: true,
    },

    children: [
      {
        path: '',
        name: 'home',
        component: HomeView,
      },

      {
        path: 'transactions',
        name: 'transactions',
        component: TransactionsView,
      },

      {
        path: 'manage',
        name: 'manage',
        component: ManageView,
      },
    ],
  },

  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const loggedIn = !!session

  if (to.meta.requiresAuth && !loggedIn) {
    return {
      name: 'login',
    }
  }

  if (to.meta.guestOnly && loggedIn) {
    return {
      name: 'home',
    }
  }
})

export default router