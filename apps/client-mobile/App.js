import { registerRootComponent } from 'expo';
import ClientMainApp from './src/app/index';

// این دستور اپلیکیشن مشتری را به عنوان هسته اصلی به اندروید معرفی می‌کند
registerRootComponent(ClientMainApp);