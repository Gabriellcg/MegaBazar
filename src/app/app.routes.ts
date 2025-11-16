import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
    { path: 'home', component: HomeComponent },
    // { path: 'status', component: StatusComponent, canActivate: [AuthGuard] },
    // { path: 'login', component: LoginComponent },
    // { path: 'chat', component: ChatComponent },
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: '**', redirectTo: 'home' }
];
