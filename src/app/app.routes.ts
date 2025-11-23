import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ProductDetail } from './components/product-detail/product-detail';
import { CartComponent } from './components/cart-component/cart-component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  // { path: 'status', component: StatusComponent, canActivate: [AuthGuard] },
  // { path: 'login', component: LoginComponent },
  // { path: 'chat', component: ChatComponent },
  {
    path: 'produto/:id',
    component: ProductDetail,
    title: 'Detalhes do Produto - MegaLoja Online'
  },
    {
    path: 'carrinho',
    component: CartComponent,
    title: 'Carrinho - MegaLoja Online'
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' }
];
