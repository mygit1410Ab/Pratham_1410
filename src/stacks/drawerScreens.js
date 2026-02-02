import { SCREEN } from '../app/layouts';

import BottomStack from './bottomStack';
import Categories from '../app/layouts/categories';
import MyOrders from '../app/layouts/myOrders';
import AboutUs from '../app/layouts/aboutUs';
import PaymentTerms from '../app/layouts/paymentTerms';
import Favourites from '../app/layouts/favourites';
// import CancelationAndReturns from '../app/layouts/cancelationReturn';
import TermsAndConditions from '../app/layouts/terms&Condition';
import LedgerStatement from '../app/layouts/ledgerStatement';
import PendingBills from '../app/layouts/pendingBills';
import ContactUs from '../app/layouts/contactUs';
import SelfProfile from '../app/layouts/selfProfile';
import Privacy from '../app/layouts/privacy/Privacy';
import Notifications from '../app/layouts/notifications';

export const drawerScreens = [
    { name: SCREEN.DRAWER_HOME, label: 'Home', component: BottomStack, icon: 'home', iconType: 'Feather' },
    { name: SCREEN.SELF_PROFILE, label: 'Self Profile', component: SelfProfile, icon: 'user', iconType: 'Feather' },
    { name: SCREEN.CATEGORIES, label: 'Shop by categories', component: Categories, icon: 'grid', iconType: 'Feather' },
    { name: SCREEN.MY_ORDERS, label: 'My Orders', component: MyOrders, icon: 'package', iconType: 'Feather' },
    { name: SCREEN.ABOUT_US, label: 'About Us', component: AboutUs, icon: 'account-box-outline', iconType: 'MaterialCommunityIcons' },
    { name: SCREEN.PAYMENT_TERMS, label: 'Payment Terms', component: PaymentTerms, icon: 'file-document-outline', iconType: 'MaterialCommunityIcons' },
    { name: SCREEN.FAVOURITES, label: 'Favourites', component: Favourites, icon: 'heart-outline', iconType: 'MaterialCommunityIcons' },
    // { name: SCREEN.CANCELATION_AND_RETURNS, label: 'Cancellation, Returns and Refund', component: CancelationAndReturns, icon: 'backup-restore', iconType: 'MaterialCommunityIcons' },
    { name: SCREEN.TERMS_AND_CONDITION, label: 'Terms and Conditions', component: TermsAndConditions, icon: 'file-document-edit-outline', iconType: 'MaterialCommunityIcons' },
    { name: SCREEN.LEDGER_STATEMENT, label: 'Ledger Statement', component: LedgerStatement, icon: 'notebook-outline', iconType: 'MaterialCommunityIcons' },
    { name: SCREEN.PENDING_BILLS, label: 'Pending Bills Report', component: PendingBills, icon: 'credit-card', iconType: 'Feather' },
    { name: SCREEN.CONTACT_US, label: 'Contact Us', component: ContactUs, icon: 'phone-outline', iconType: 'MaterialCommunityIcons' },
    { name: SCREEN.NOTIFICATIONS, label: 'Notifications', component: Notifications, icon: 'help-circle', iconType: 'Feather' },
    { name: SCREEN.PRIVACY, label: 'Privacy', component: Privacy, icon: 'privacy-tip', iconType: 'MaterialIcons' },
];
