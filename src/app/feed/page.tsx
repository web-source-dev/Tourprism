'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Skeleton,
  Dialog,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Snackbar,
  Alert as MuiAlert,
  DialogActions,
  Container,
  Chip
} from '@mui/material';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import FilterDrawer from '@/components/FilterDrawer';
import { fetchAlerts, getUserProfile } from '@/services/api';
import { followAlert, flagAlert } from '@/services/alertActions';
import { Alert as AlertType, FilterOptions, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { io, Socket } from 'socket.io-client';
import Countdown from 'react-countdown';
<<<<<<< HEAD
=======
import { useToast } from '@/ui/toast';
import GetAccessCard from '@/components/GetAccessCard';
import UnlockFeaturesCard from '@/components/UnlockFeaturesCard';

// Extend the existing User interface with the new properties
interface ExtendedUser extends User {
  isProfileComplete?: boolean;
  profileCompletionPercentage?: number;
}
>>>>>>> 2945eb6 (Initial commit)

// Function to get the appropriate icon based on alert category
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Weather':
      return (
        <svg width="16" height="16" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M1.81801 9.6729C0.825325 8.69779 0.208328 7.33732 0.208328 5.83296C0.208328 2.86743 2.6051 0.458374 5.56785 0.458374C7.1889 0.458374 8.64087 1.18062 9.62225 2.31787C10.5711 1.87341 11.632 1.62504 12.75 1.62504C16.6816 1.62504 19.9086 4.69831 20.0376 8.56669C22.9976 8.98274 25.2917 11.4879 25.2917 14.5417C25.2917 16.6419 24.2031 18.486 22.5643 19.5643C22.1606 19.83 21.618 19.718 21.3524 19.3143C21.0867 18.9106 21.1987 18.368 21.6024 18.1024C22.7775 17.3292 23.5417 16.02 23.5417 14.5417C23.5417 12.4246 21.9673 10.6475 19.8811 10.3127C19.6319 11.4637 19.103 12.5118 18.3699 13.3843C18.0591 13.7543 17.5071 13.8023 17.1371 13.4914C16.7671 13.1805 16.7192 12.6286 17.03 12.2586C17.7199 11.4374 18.1668 10.4173 18.2692 9.30116C18.284 9.1388 18.2917 8.97417 18.2917 8.80758C18.2917 5.82136 15.8248 3.37504 12.75 3.37504C10.1852 3.37504 8.04176 5.0786 7.40271 7.37628C8.72158 7.46946 9.93737 7.93883 10.9371 8.67714C11.3258 8.96423 11.4082 9.51209 11.1211 9.90081C10.834 10.2895 10.2861 10.3719 9.89741 10.0848C9.06872 9.47282 8.03789 9.10916 6.91666 9.10916C6.75518 9.10916 6.59574 9.1167 6.43865 9.1314C3.91262 9.36769 1.95833 11.4551 1.95833 13.9683C1.95833 15.551 2.73036 16.9611 3.93643 17.8517C4.32518 18.1388 4.40762 18.6866 4.12055 19.0754C3.83349 19.4641 3.28564 19.5465 2.89689 19.2595C1.26949 18.0578 0.208328 16.1374 0.208328 13.9683C0.208328 12.3249 0.815445 10.8262 1.81801 9.6729ZM1.95833 5.83296C1.95833 3.82839 3.57713 2.20837 5.56785 2.20837C6.56037 2.20837 7.46014 2.61019 8.11388 3.26358C6.82037 4.3139 5.89942 5.79579 5.58072 7.49044C4.68921 7.66816 3.8606 8.02033 3.13407 8.50976C2.41084 7.84641 1.95833 6.89309 1.95833 5.83296Z" fill="#616161" />
          <path d="M8.47483 16.8843C8.90706 17.1004 9.08226 17.626 8.86614 18.0582L7.69948 20.3915C7.48336 20.8238 6.95777 20.999 6.52554 20.7829C6.09331 20.5667 5.91811 20.0412 6.13423 19.6089L7.3009 17.2756C7.51701 16.8434 8.0426 16.6682 8.47483 16.8843Z" fill="#616161" />
          <path d="M13.7248 16.8843C14.1571 17.1004 14.3323 17.626 14.1161 18.0582L12.9495 20.3915C12.7334 20.8238 12.2078 20.999 11.7755 20.7829C11.3433 20.5667 11.1681 20.0412 11.3842 19.6089L12.5509 17.2756C12.767 16.8434 13.2926 16.6682 13.7248 16.8843Z" fill="#616161" />
          <path d="M18.9748 16.8843C19.4071 17.1004 19.5823 17.626 19.3661 18.0582L18.1995 20.3915C17.9834 20.8238 17.4578 20.999 17.0255 20.7829C16.5933 20.5667 16.4181 20.0412 16.6342 19.6089L17.8009 17.2756C18.017 16.8434 18.5426 16.6682 18.9748 16.8843Z" fill="#616161" />
          <path d="M9.6415 21.5509C10.0737 21.7671 10.2489 22.2926 10.0328 22.7249L8.86614 25.0582C8.65003 25.4904 8.12444 25.6656 7.69221 25.4495C7.25998 25.2334 7.08478 24.7078 7.3009 24.2756L8.46756 21.9423C8.68368 21.51 9.20927 21.3348 9.6415 21.5509Z" fill="#616161" />
          <path d="M14.8915 21.5509C15.3237 21.7671 15.4989 22.2926 15.2828 22.7249L14.1161 25.0582C13.9 25.4904 13.3744 25.6656 12.9422 25.4495C12.51 25.2334 12.3348 24.7078 12.5509 24.2756L13.7176 21.9423C13.9337 21.51 14.4593 21.3348 14.8915 21.5509Z" fill="#616161" />
        </svg>

      );
    case 'Transport':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.83301 11.6667C6.83301 11.3905 7.05687 11.1667 7.33301 11.1667H8.66634C8.94248 11.1667 9.16634 11.3905 9.16634 11.6667C9.16634 11.9428 8.94248 12.1667 8.66634 12.1667H7.33301C7.05687 12.1667 6.83301 11.9428 6.83301 11.6667Z" fill="#757575" />
          <path fillRule="evenodd" clipRule="evenodd" d="M2.91761 2.67407C3.75577 1.92294 5.42033 0.833336 7.99972 0.833336C10.5791 0.833336 12.2437 1.92294 13.0818 2.67407L13.0961 2.68683C13.3284 2.89495 13.5142 3.06136 13.6737 3.41847C13.8336 3.77651 13.8334 4.08864 13.8331 4.47216L13.8331 9.36992C13.8331 10.2816 13.8331 11.0165 13.7554 11.5945C13.6747 12.1946 13.5021 12.6998 13.1008 13.1011C12.7539 13.448 12.3294 13.624 11.833 13.7174V14.6667C11.833 14.9428 11.6091 15.1667 11.333 15.1667C11.0569 15.1667 10.833 14.9428 10.833 14.6667V13.8162C10.4068 13.8334 9.92052 13.8333 9.36964 13.8333H6.62981C6.07888 13.8333 5.59252 13.8334 5.16634 13.8162V14.6667C5.16634 14.9428 4.94248 15.1667 4.66634 15.1667C4.3902 15.1667 4.16634 14.9428 4.16634 14.6667V13.7174C3.67002 13.624 3.24548 13.448 2.89862 13.1011C2.49734 12.6998 2.32475 12.1946 2.24407 11.5945C2.16636 11.0165 2.16637 10.2816 2.16639 9.36992L2.16636 4.47216C2.16608 4.08864 2.16585 3.77651 2.32577 3.41847C2.48526 3.06136 2.67103 2.89495 2.90337 2.68683L2.91761 2.67407ZM7.99972 1.83334C5.72617 1.83334 4.28951 2.78743 3.58499 3.41879C3.55125 3.44902 3.52146 3.47582 3.49497 3.5L12.5045 3.5C12.478 3.47582 12.4482 3.44902 12.4145 3.41879C11.7099 2.78743 10.2733 1.83334 7.99972 1.83334ZM3.16639 4.5L3.16639 8.94459L3.1926 8.95078C3.4498 9.0113 3.82554 9.09259 4.29396 9.17405C5.23183 9.33716 6.53565 9.49999 7.99995 9.49999C9.46425 9.49999 10.7681 9.33716 11.7059 9.17405C12.1744 9.09259 12.5501 9.0113 12.8073 8.95078L12.8331 8.9447L12.833 4.5L3.16639 4.5ZM12.832 9.97095C12.5786 10.0273 12.2563 10.0933 11.8773 10.1593C10.8985 10.3295 9.53565 10.5 7.99995 10.5C6.46425 10.5 5.10141 10.3295 4.12261 10.1593C3.74334 10.0933 3.42091 10.0272 3.16746 9.97084C3.16991 10.448 3.17795 10.8385 3.20421 11.1667H3.99967C4.27582 11.1667 4.49967 11.3905 4.49967 11.6667C4.49967 11.9428 4.27582 12.1667 3.99967 12.1667H3.43544C3.48464 12.256 3.54126 12.3295 3.60573 12.394C3.79024 12.5785 4.04928 12.6988 4.53847 12.7646C5.04204 12.8323 5.70944 12.8333 6.66639 12.8333H9.33306C10.29 12.8333 10.9574 12.8323 11.461 12.7646C11.9502 12.6988 12.2092 12.5785 12.3937 12.394C12.4582 12.3295 12.5148 12.256 12.564 12.1667H11.9997C11.7235 12.1667 11.4997 11.9428 11.4997 11.6667C11.4997 11.3905 11.7235 11.1667 11.9997 11.1667H12.7952C12.8215 10.8386 12.8295 10.4481 12.832 9.97095Z" fill="#757575" />
          <path d="M1.33301 5.5C1.60915 5.5 1.83301 5.72386 1.83301 6L1.83301 6.66667C1.83301 6.94281 1.60915 7.16667 1.33301 7.16667C1.05687 7.16667 0.833008 6.94281 0.833008 6.66667L0.833008 6C0.833008 5.72386 1.05687 5.5 1.33301 5.5Z" fill="#757575" />
          <path d="M15.1663 6C15.1663 5.72386 14.9425 5.5 14.6663 5.5C14.3902 5.5 14.1663 5.72386 14.1663 6V6.66667C14.1663 6.94281 14.3902 7.16667 14.6663 7.16667C14.9425 7.16667 15.1663 6.94281 15.1663 6.66667V6Z" fill="#757575" />
        </svg>
      );
    case 'Civil Unrest':
      return (
        <svg width="16" height="16" viewBox="0 0 21 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.41668 15.6249L6.08334 15.6249L6.02268 15.6249C4.97445 15.6249 4.10036 15.6249 3.40645 15.7182C2.67402 15.8166 2.01276 16.0332 1.48137 16.5646C0.949993 17.096 0.733378 17.7573 0.634905 18.4897C0.541613 19.1836 0.54164 20.0577 0.541673 21.1059L0.541676 24.6666C0.541676 25.1498 0.933426 25.5416 1.41668 25.5416C1.89992 25.5416 2.29168 25.1498 2.29168 24.6666L2.29168 21.1666C2.29168 20.0419 2.29353 19.2864 2.3693 18.7229C2.44168 18.1845 2.56678 17.9541 2.71881 17.8021C2.87085 17.65 3.10126 17.5249 3.63963 17.4525C4.04272 17.3984 4.544 17.382 5.20834 17.377L5.20834 24.6666C5.20834 25.1498 5.60009 25.5416 6.08334 25.5416C6.56659 25.5416 6.95834 25.1498 6.95834 24.6666L6.95834 17.3749L8.05424 17.3749L10.1313 19.452C10.473 19.7937 11.027 19.7937 11.3687 19.452L13.4458 17.3749H14.5417L14.5417 24.6666C14.5417 25.1498 14.9334 25.5416 15.4167 25.5416C15.8999 25.5416 16.2917 25.1498 16.2917 24.6666L16.2917 17.377C16.956 17.382 17.4573 17.3984 17.8604 17.4525C18.3988 17.5249 18.6292 17.65 18.7812 17.8021C18.9332 17.9541 19.0583 18.1845 19.1307 18.7229C19.2065 19.2864 19.2083 20.0419 19.2083 21.1666L19.2083 24.6666C19.2083 25.1498 19.6001 25.5416 20.0833 25.5416C20.5666 25.5416 20.9583 25.1498 20.9583 24.6666L20.9583 21.1059C20.9584 20.0577 20.9584 19.1836 20.8651 18.4897C20.7666 17.7573 20.55 17.096 20.0186 16.5646C19.4873 16.0332 18.826 15.8166 18.0936 15.7182C17.3997 15.6249 16.5256 15.6249 15.4773 15.6249L15.4167 15.6249L13.0833 15.6249C12.8513 15.6249 12.6287 15.7171 12.4646 15.8812L10.75 17.5958L9.03539 15.8812C8.8713 15.7171 8.64874 15.6249 8.41668 15.6249Z" fill="#616161" />
          <path fillRule="evenodd" clipRule="evenodd" d="M9.87501 2.28521C7.64706 2.6819 5.93401 4.56655 5.80011 6.87492H5.50001C5.01676 6.87492 4.62501 7.26667 4.62501 7.74992C4.62501 8.23317 5.01676 8.62492 5.50001 8.62492H5.79168V9.49992C5.79168 12.2383 8.0116 14.4583 10.75 14.4583C13.4884 14.4583 15.7083 12.2383 15.7083 9.49992V8.62492H16C16.4833 8.62492 16.875 8.23317 16.875 7.74992C16.875 7.26667 16.4833 6.87492 16 6.87492H15.6999C15.566 4.56655 13.853 2.6819 11.625 2.28521V1.33325C11.625 0.850003 11.2333 0.458252 10.75 0.458252C10.2668 0.458252 9.87501 0.850003 9.87501 1.33325V2.28521ZM10.75 3.95825C12.4236 3.95825 13.7979 5.23969 13.9453 6.87492L7.55476 6.87492C7.70211 5.23969 9.07641 3.95825 10.75 3.95825ZM13.9583 9.49992V8.62492L7.54168 8.62492V9.49992C7.54168 11.2718 8.9781 12.7083 10.75 12.7083C12.5219 12.7083 13.9583 11.2718 13.9583 9.49992Z" fill="#616161" />
        </svg>


      );
    case 'Health':
      return (
        <svg width="16" height="16" viewBox="0 0 26 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.375 8.50004C12.375 8.01679 12.7668 7.62504 13.25 7.62504C13.7333 7.62504 14.125 8.01679 14.125 8.50004V11.125H16.75C17.2333 11.125 17.625 11.5168 17.625 12C17.625 12.4833 17.2333 12.875 16.75 12.875H14.125V15.5C14.125 15.9833 13.7333 16.375 13.25 16.375C12.7668 16.375 12.375 15.9833 12.375 15.5V12.875L9.75001 12.875C9.26676 12.875 8.87501 12.4833 8.87501 12C8.87501 11.5168 9.26676 11.125 9.75001 11.125L12.375 11.125V8.50004Z" fill="#616161" />
          <path fillRule="evenodd" clipRule="evenodd" d="M13.9312 2.04561C15.816 0.630167 18.9359 -0.220037 22.4137 1.91325C24.8185 3.38834 26.1716 6.4696 25.6968 10.0099C25.2197 13.5672 22.9172 17.5906 18.041 21.1998L17.9196 21.2897C16.2264 22.5438 15.105 23.3743 13.2499 23.3743C11.3948 23.3743 10.2734 22.5438 8.58017 21.2897L8.45878 21.1998C3.58258 17.5906 1.28006 13.5672 0.802955 10.0099C0.32814 6.4696 1.68128 3.38834 4.08606 1.91325C7.56386 -0.220037 10.6838 0.630167 12.5686 2.04561C12.8787 2.27847 13.0915 2.43783 13.2499 2.54545C13.4083 2.43783 13.6211 2.27847 13.9312 2.04561ZM13.4352 2.65922C13.4351 2.65921 13.4343 2.6589 13.4328 2.65821L13.4311 2.65746C13.4339 2.65858 13.4353 2.65923 13.4352 2.65922ZM13.0687 2.65746C13.0639 2.65935 13.0633 2.6599 13.067 2.65821L13.0687 2.65746ZM21.4987 3.40497C18.7193 1.7001 16.378 2.39663 14.9821 3.44495L14.9577 3.46324C14.6423 3.70014 14.3713 3.90369 14.1545 4.04559C14.0419 4.11934 13.9171 4.19445 13.7876 4.25295C13.6648 4.30847 13.476 4.37793 13.2499 4.37793C13.0238 4.37793 12.835 4.30847 12.7121 4.25295C12.5827 4.19445 12.4579 4.11934 12.3453 4.04559C12.1285 3.90369 11.8576 3.70021 11.5422 3.46332L11.5177 3.44495C10.1218 2.39663 7.78046 1.7001 5.00108 3.40497C3.29993 4.44846 2.13556 6.78094 2.53743 9.77724C2.937 12.7565 4.90533 16.3925 9.49991 19.7932C11.3458 21.1594 12.0195 21.6243 13.2499 21.6243C14.4803 21.6243 15.154 21.1594 16.9999 19.7932C21.5945 16.3925 23.5628 12.7565 23.9624 9.77724C24.3642 6.78094 23.1999 4.44846 21.4987 3.40497Z" fill="#616161" />
        </svg>
      )
    case 'General Safety':
      return (
        <svg width="16" height="16" viewBox="0 0 24 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M14.3223 6.65229C14.3223 5.99454 13.9345 5.45603 13.3919 5.2334C12.838 5.00617 12.1576 5.12897 11.7184 5.67151L7.05292 11.4356C6.65762 11.9239 6.62976 12.5415 6.82895 13.0206C7.02902 13.5017 7.50794 13.9427 8.18277 13.9427H10.1761V18.1804C10.1761 18.8381 10.5639 19.3766 11.1065 19.5993C11.6604 19.8265 12.3408 19.7037 12.78 19.1612L17.4455 13.3971C17.8408 12.9087 17.8686 12.2912 17.6695 11.8121C17.4694 11.3309 16.9905 10.89 16.3156 10.89H14.3223V6.65229ZM8.69154 12.1927L12.5723 7.39807V11.1137C12.5723 11.8864 13.1649 12.64 14.0464 12.64H15.8069L11.9261 17.4346V13.719C11.9261 12.9463 11.3335 12.1927 10.452 12.1927H8.69154Z" fill="#616161" />
          <path fillRule="evenodd" clipRule="evenodd" d="M12.2483 0.458374C10.3679 0.458374 8.84278 1.12914 7.52326 1.85073C7.12088 2.07077 6.7487 2.2875 6.39413 2.49396C5.53221 2.99586 4.77436 3.43715 3.93989 3.71819L3.90966 3.72837C3.41712 3.89425 3.00521 4.03296 2.69239 4.16236C2.39624 4.28485 2.03997 4.45474 1.7887 4.7495C1.56675 5.00988 1.45453 5.29934 1.38034 5.57371C1.3124 5.82496 1.2603 6.13014 1.20401 6.45988L1.19809 6.49453C-0.164452 14.4711 2.80432 22.0658 10.1433 25.0317L10.1836 25.048C10.8992 25.3373 11.4048 25.5417 12.252 25.5417C13.0991 25.5417 13.6047 25.3373 14.3202 25.048L14.3606 25.0317C21.6993 22.0656 24.6651 14.4707 23.3022 6.49448L23.2963 6.45976C23.24 6.12999 23.1878 5.82479 23.1199 5.57352C23.0457 5.29913 22.9334 5.00963 22.7114 4.74925C22.4601 4.45449 22.1038 4.28465 21.8077 4.1622C21.4948 4.03284 21.0829 3.8942 20.5904 3.72841L20.5602 3.71825C19.7253 3.43719 18.9668 2.99577 18.1042 2.4938C17.7495 2.28737 17.3772 2.07068 16.9747 1.85072C15.6545 1.12915 14.1288 0.458374 12.2483 0.458374ZM4.49844 5.37666C5.51382 5.03469 6.50496 4.45745 7.42424 3.92207C7.74665 3.73429 8.06022 3.55167 8.3629 3.38615C9.58955 2.71535 10.8044 2.20837 12.2483 2.20837C13.6924 2.20837 14.9079 2.71543 16.1354 3.38632C16.4382 3.55184 16.752 3.73443 17.0745 3.92217C17.9944 4.45759 18.9862 5.03487 20.0019 5.3768C20.5325 5.55541 20.8875 5.67542 21.139 5.7794C21.2898 5.84174 21.3601 5.88204 21.3859 5.89763C21.3952 5.91769 21.4109 5.95766 21.4306 6.03039C21.4741 6.19146 21.5129 6.41305 21.5772 6.78923C22.844 14.2033 20.0691 20.837 13.7048 23.4092C12.9696 23.7063 12.742 23.7917 12.252 23.7917C11.7619 23.7917 11.5343 23.7063 10.799 23.4092C4.43411 20.8369 1.65669 14.203 2.9231 6.7892C2.98735 6.41308 3.02613 6.19154 3.06967 6.03049C3.08934 5.95778 3.10499 5.91783 3.1143 5.89777C3.14016 5.88217 3.21046 5.84186 3.36128 5.77948C3.61278 5.67545 3.96783 5.55537 4.49844 5.37666Z" fill="#616161" />
        </svg>

      );
    case 'Natural Disaster':
      return (
        <svg width="11.692" height="16" viewBox="0 0 11.692 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.165 2.954c-0.358 0.32 -0.559 0.641 -0.618 0.953 -0.084 0.439 -0.007 0.759 0.151 1.007 0.166 0.259 0.455 0.491 0.88 0.677 0.86 0.377 2.127 0.503 3.448 0.402 1.314 -0.101 2.596 -0.42 3.465 -0.86 0.437 -0.222 0.725 -0.45 0.874 -0.657 0.134 -0.183 0.148 -0.326 0.09 -0.478 -0.09 -0.237 -0.34 -0.456 -0.852 -0.6 -0.505 -0.142 -1.168 -0.179 -1.89 -0.127a10.707 10.707 0 0 0 -2.099 0.372c-0.654 0.186 -1.164 0.407 -1.447 0.606a0.538 0.538 0 1 1 -0.618 -0.882c0.427 -0.3 1.071 -0.56 1.77 -0.759a11.692 11.692 0 0 1 2.316 -0.41c0.787 -0.057 1.588 -0.025 2.258 0.164 0.665 0.186 1.303 0.558 1.567 1.254 0.208 0.547 0.084 1.068 -0.225 1.493 -0.292 0.402 -0.749 0.727 -1.26 0.986 -1.029 0.521 -2.458 0.864 -3.868 0.972 -1.403 0.108 -2.873 -0.011 -3.963 -0.489 -0.55 -0.241 -1.039 -0.59 -1.354 -1.083C0.468 4.988 0.361 4.383 0.489 3.705c0.118 -0.622 0.494 -1.139 0.958 -1.554 0.465 -0.417 1.05 -0.759 1.66 -1.03C4.319 0.582 5.725 0.282 6.698 0.282a0.538 0.538 0 0 1 0 1.077c-0.802 0 -2.058 0.26 -3.154 0.747 -0.545 0.242 -1.024 0.529 -1.38 0.848" fill="#616161" /><path d="M10.742 7.104a0.538 0.538 0 0 1 -0.118 0.752c-1.042 0.76 -2.851 1.245 -4.586 1.369 -0.88 0.063 -1.771 0.035 -2.574 -0.109 -0.796 -0.143 -1.547 -0.407 -2.106 -0.85a0.538 0.538 0 1 1 0.669 -0.844c0.366 0.29 0.923 0.508 1.627 0.634 0.697 0.125 1.496 0.153 2.308 0.095 1.647 -0.117 3.221 -0.577 4.029 -1.164a0.538 0.538 0 0 1 0.752 0.118" fill="#616161" /><path d="M7.553 15.489a0.538 0.538 0 0 0 -0.203 -1.058c-0.672 0.129 -1.383 0.203 -2.074 0.21a0.538 0.538 0 0 0 0.012 1.077c0.757 -0.008 1.532 -0.089 2.265 -0.229" fill="#616161" /><path d="M1.914 10.063a0.538 0.538 0 0 1 0.706 -0.286c0.655 0.277 1.543 0.415 2.518 0.417a11.692 11.692 0 0 0 2.881 -0.36 0.538 0.538 0 0 1 0.27 1.042c-0.983 0.255 -2.092 0.398 -3.153 0.394 -1.055 -0.002 -2.1 -0.149 -2.935 -0.502a0.538 0.538 0 0 1 -0.286 -0.706" fill="#616161" /><path d="M3.284 12.146a0.538 0.538 0 1 0 -0.256 1.046c1.127 0.276 2.485 0.29 3.758 0.126a0.538 0.538 0 1 0 -0.138 -1.068c-1.185 0.154 -2.402 0.131 -3.364 -0.104" fill="#616161" /></svg>
      );
    default:
      // Default icon if category doesn't match
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.83301 11.6667C6.83301 11.3905 7.05687 11.1667 7.33301 11.1667H8.66634C8.94248 11.1667 9.16634 11.3905 9.16634 11.6667C9.16634 11.9428 8.94248 12.1667 8.66634 12.1667H7.33301C7.05687 12.1667 6.83301 11.9428 6.83301 11.6667Z" fill="#757575" />
          <path fillRule="evenodd" clipRule="evenodd" d="M2.91761 2.67407C3.75577 1.92294 5.42033 0.833336 7.99972 0.833336C10.5791 0.833336 12.2437 1.92294 13.0818 2.67407L13.0961 2.68683C13.3284 2.89495 13.5142 3.06136 13.6737 3.41847C13.8336 3.77651 13.8334 4.08864 13.8331 4.47216L13.8331 9.36992C13.8331 10.2816 13.8331 11.0165 13.7554 11.5945C13.6747 12.1946 13.5021 12.6998 13.1008 13.1011C12.7539 13.448 12.3294 13.624 11.833 13.7174V14.6667C11.833 14.9428 11.6091 15.1667 11.333 15.1667C11.0569 15.1667 10.833 14.9428 10.833 14.6667V13.8162C10.4068 13.8334 9.92052 13.8333 9.36964 13.8333H6.62981C6.07888 13.8333 5.59252 13.8334 5.16634 13.8162V14.6667C5.16634 14.9428 4.94248 15.1667 4.66634 15.1667C4.3902 15.1667 4.16634 14.9428 4.16634 14.6667V13.7174C3.67002 13.624 3.24548 13.448 2.89862 13.1011C2.49734 12.6998 2.32475 12.1946 2.24407 11.5945C2.16636 11.0165 2.16637 10.2816 2.16639 9.36992L2.16636 4.47216C2.16608 4.08864 2.16585 3.77651 2.32577 3.41847C2.48526 3.06136 2.67103 2.89495 2.90337 2.68683L2.91761 2.67407ZM7.99972 1.83334C5.72617 1.83334 4.28951 2.78743 3.58499 3.41879C3.55125 3.44902 3.52146 3.47582 3.49497 3.5L12.5045 3.5C12.478 3.47582 12.4482 3.44902 12.4145 3.41879C11.7099 2.78743 10.2733 1.83334 7.99972 1.83334ZM3.16639 4.5L3.16639 8.94459L3.1926 8.95078C3.4498 9.0113 3.82554 9.09259 4.29396 9.17405C5.23183 9.33716 6.53565 9.49999 7.99995 9.49999C9.46425 9.49999 10.7681 9.33716 11.7059 9.17405C12.1744 9.09259 12.5501 9.0113 12.8073 8.95078L12.8331 8.9447L12.833 4.5L3.16639 4.5ZM12.832 9.97095C12.5786 10.0273 12.2563 10.0933 11.8773 10.1593C10.8985 10.3295 9.53565 10.5 7.99995 10.5C6.46425 10.5 5.10141 10.3295 4.12261 10.1593C3.74334 10.0933 3.42091 10.0272 3.16746 9.97084C3.16991 10.448 3.17795 10.8385 3.20421 11.1667H3.99967C4.27582 11.1667 4.49967 11.3905 4.49967 11.6667C4.49967 11.9428 4.27582 12.1667 3.99967 12.1667H3.43544C3.48464 12.256 3.54126 12.3295 3.60573 12.394C3.79024 12.5785 4.04928 12.6988 4.53847 12.7646C5.04204 12.8323 5.70944 12.8333 6.66639 12.8333H9.33306C10.29 12.8333 10.9574 12.8323 11.461 12.7646C11.9502 12.6988 12.2092 12.5785 12.3937 12.394C12.4582 12.3295 12.5148 12.256 12.564 12.1667H11.9997C11.7235 12.1667 11.4997 11.9428 11.4997 11.6667C11.4997 11.3905 11.7235 11.1667 11.9997 11.1667H12.7952C12.8215 10.8386 12.8295 10.4481 12.832 9.97095Z" fill="#757575" />
          <path d="M1.33301 5.5C1.60915 5.5 1.83301 5.72386 1.83301 6L1.83301 6.66667C1.83301 6.94281 1.60915 7.16667 1.33301 7.16667C1.05687 7.16667 0.833008 6.94281 0.833008 6.66667L0.833008 6C0.833008 5.72386 1.05687 5.5 1.33301 5.5Z" fill="#757575" />
          <path d="M15.1663 6C15.1663 5.72386 14.9425 5.5 14.6663 5.5C14.3902 5.5 14.1663 5.72386 14.1663 6V6.66667C14.1663 6.94281 14.3902 7.16667 14.6663 7.16667C14.9425 7.16667 15.1663 6.94281 15.1663 6.66667V6Z" fill="#757575" />
        </svg>
      );
  }
};

// Function to format date in "Month Day, Time" format
const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Add this before the fetchOperatingRegionAlerts function as a shared helper function
// Helper function to sort alerts by the selected sort criteria
const sortAlertsByFilter = (alerts: AlertType[], sortBy: string) => {
  return [...alerts].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt || b.updatedAt).getTime() - new Date(a.createdAt || a.updatedAt).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt || a.updatedAt).getTime() - new Date(b.createdAt || b.updatedAt).getTime();
    } else {
      // Default to sorting by most follows
      return (b.numberOfFollows || 0) - (a.numberOfFollows || 0);
    }
  });
};

export default function Feed() {
  const router = useRouter();
  const { isAuthenticated, isCollaboratorViewer } = useAuth();
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [lowAccuracyWarning, setLowAccuracyWarning] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
<<<<<<< HEAD
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [operatingRegionAlerts, setOperatingRegionAlerts] = useState<AlertType[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: '',
    incidentTypes: [],
    timeRange: 0,
    distance: 50
  });
=======
  const [userProfile, setUserProfile] = useState<ExtendedUser | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [operatingRegionAlerts, setOperatingRegionAlerts] = useState<AlertType[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: '',
    alertCategory: [],
    timeRange: 0,
    distance: 50,
    impactLevel: '',
    customDateFrom: new Date(),
    customDateTo: new Date(),
  });
  const { showToast } = useToast();
>>>>>>> 2945eb6 (Initial commit)

  const isViewOnly = () => {
    return isCollaboratorViewer;
  };

  // Socket.io reference
  const socketRef = useRef<Socket | null>(null);

  // Fetch user profile if authenticated
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuthenticated) {
        try {
          const { user } = await getUserProfile();
          setUserProfile(user);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        } finally {
          setProfileLoaded(true);
        }
      } else {
        setProfileLoaded(true);
      }
    };

    fetchUserProfile();
  }, [isAuthenticated]);

  // Function to fetch alerts based on operating regions
  const fetchOperatingRegionAlerts = useCallback(async () => {
    // Use optional chaining with nullish coalescing to handle possibly undefined array
    const operatingRegions = userProfile?.company?.MainOperatingRegions ?? [];
    if (operatingRegions.length === 0) return [];
    
    setLoading(true);
    let combinedAlerts: AlertType[] = [];
    
    try {
      // For each operating region, fetch alerts
      for (const region of operatingRegions) {
        const params: Record<string, unknown> = {
          page: 1,
          limit: 10,
          sortBy: filters.sortBy,
          latitude: region.latitude,
          longitude: region.longitude,
          distance: filters.distance || 50
        };
        
        if (filters.timeRange > 0) {
          const now = new Date();
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + filters.timeRange);
          
          params.startDate = now.toISOString();
          params.endDate = futureDate.toISOString();
<<<<<<< HEAD
        }
        
        if (filters.incidentTypes && filters.incidentTypes.length > 0) {
          params.incidentTypes = filters.incidentTypes;
=======
        } else if (filters.timeRange === -1 && filters.customDateFrom && filters.customDateTo) {
          // Handle custom date range
          params.startDate = new Date(filters.customDateFrom).toISOString();
          params.endDate = new Date(filters.customDateTo).toISOString();
        }
        
        if (filters.alertCategory && filters.alertCategory.length > 0) {
          params.alertCategory = filters.alertCategory;
        }
        
        if (filters.impactLevel) {
          params.impact = filters.impactLevel;
>>>>>>> 2945eb6 (Initial commit)
        }
        
        console.log(`Fetching alerts for operating region ${region.name} with params:`, params);
        const response = await fetchAlerts(params);
        combinedAlerts = [...combinedAlerts, ...response.alerts];
      }
      
      // Remove duplicates
      combinedAlerts = Array.from(
        new Map(combinedAlerts.map(alert => [alert._id, alert])).values()
      );
      
      // Sort alerts with priority for followed alerts and then by filter criteria
      combinedAlerts.sort((a, b) => {
        // First priority: followed alerts go to the top
        if (a.isFollowing && !b.isFollowing) return -1;
        if (!a.isFollowing && b.isFollowing) return 1;
        
        // Second priority: maintain the sort order within each group using the shared sorting function
        return sortAlertsByFilter([a, b], filters.sortBy)[0] === a ? -1 : 1;
      });
      
      setOperatingRegionAlerts(combinedAlerts);
      return combinedAlerts;
    } catch (error) {
      console.error('Error fetching operating region alerts:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [userProfile, filters]);

  // Define the fetchLocationAlerts function with useCallback to avoid recreation on each render
  const fetchLocationAlerts = useCallback(async (cityName: string = "Edinburgh", coordinates: { latitude: number; longitude: number } | null = null) => {
    setLoading(true);
    try {
      // Check if we have operating regions
      const operatingRegions = userProfile?.company?.MainOperatingRegions ?? [];
      const hasOperatingRegions = isAuthenticated && operatingRegions.length > 0;
      
      // Skip default Edinburgh location if we have operating regions and the current location is Edinburgh
      const isDefaultEdinburgh = 
        cityName === "Edinburgh" && 
        coordinates?.latitude === 55.9533 && 
        coordinates?.longitude === -3.1883;
      
      const skipDefaultLocation = hasOperatingRegions && isDefaultEdinburgh;
      
      // First check if we need to fetch operating region alerts
      let operatingRegionsResults: AlertType[] = [];
      if (hasOperatingRegions) {
        operatingRegionsResults = await fetchOperatingRegionAlerts();
      }
      
      // Only fetch location-based alerts if we're not skipping the default location
      let locationBasedAlerts: AlertType[] = [];
      if (!skipDefaultLocation) {
        const params: Record<string, unknown> = {
          page: 1,
          limit: isAuthenticated ? 10 : 15,
          sortBy: filters.sortBy,
        };
        if (filters.timeRange > 0) {
          const now = new Date();
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + filters.timeRange);

          params.startDate = now.toISOString();
          params.endDate = futureDate.toISOString();
<<<<<<< HEAD
        }

        if (filters.incidentTypes && filters.incidentTypes.length > 0) {
          params.incidentTypes = filters.incidentTypes;
=======
        } else if (filters.timeRange === -1 && filters.customDateFrom && filters.customDateTo) {
          // Handle custom date range
          params.startDate = new Date(filters.customDateFrom).toISOString();
          params.endDate = new Date(filters.customDateTo).toISOString();
        }

        if (filters.alertCategory && filters.alertCategory.length > 0) {
          params.alertCategory = filters.alertCategory;
        }

        if (filters.impactLevel) {
          params.impact = filters.impactLevel;
>>>>>>> 2945eb6 (Initial commit)
        }

        if (coordinates) {
          params.latitude = coordinates.latitude;
          params.longitude = coordinates.longitude;
          if (filters.distance && filters.distance > 0) {
            params.distance = filters.distance;
          }
        } else if (cityName) {
          params.city = cityName;
        }

        console.log('Fetching regular alerts with params:', params);
        const response = await fetchAlerts(params);

        locationBasedAlerts = Array.from(
          new Map(response.alerts.map(alert => [alert._id, alert])).values()
        );

        if (locationBasedAlerts.length < response.alerts.length) {
          console.warn(`Filtered out ${response.alerts.length - locationBasedAlerts.length} duplicate alert(s) in initial load`);
        }
      }
      
      // STEP 1: Organize alerts into their respective categories
      // Get followed alerts from both sources
      const followedAlerts = [
        ...operatingRegionsResults.filter(alert => alert.isFollowing),
        ...locationBasedAlerts.filter(alert => alert.isFollowing)
      ];
      
      // Get non-followed operating region alerts
      const nonFollowedOperatingRegionAlerts = operatingRegionsResults.filter(alert => !alert.isFollowing);
      
      // Get normal location alerts (not followed, not from operating regions)
      const normalAlerts = locationBasedAlerts.filter(alert => !alert.isFollowing);
      
      // STEP 2: Sort each category internally according to the filter criteria
      const sortedFollowedAlerts = sortAlertsByFilter(followedAlerts, filters.sortBy);
      const sortedOperatingRegionAlerts = sortAlertsByFilter(nonFollowedOperatingRegionAlerts, filters.sortBy);
      const sortedNormalAlerts = sortAlertsByFilter(normalAlerts, filters.sortBy);
      
      // STEP 3: Combine all categories in the correct order while removing duplicates
      const sortedAllAlerts: AlertType[] = [];
      const addedIds = new Set<string>();
      
      // Add followed alerts first (highest priority)
      sortedFollowedAlerts.forEach(alert => {
        if (!addedIds.has(alert._id)) {
          sortedAllAlerts.push(alert);
          addedIds.add(alert._id);
        }
      });
      
      // Add operating region alerts second (medium priority)
      sortedOperatingRegionAlerts.forEach(alert => {
        if (!addedIds.has(alert._id)) {
          sortedAllAlerts.push(alert);
          addedIds.add(alert._id);
        }
      });
      
      // Add normal alerts last (lowest priority)
      sortedNormalAlerts.forEach(alert => {
        if (!addedIds.has(alert._id)) {
          sortedAllAlerts.push(alert);
          addedIds.add(alert._id);
        }
      });
      
      // Apply the limit for non-authenticated users
      if (!isAuthenticated) {
        setAlerts(sortedAllAlerts.slice(0, 15));
      } else {
        setAlerts(sortedAllAlerts);
      }

      // Set total count to include both sets for pagination
      const totalRegularAlerts = skipDefaultLocation ? 0 : locationBasedAlerts.length;
      setTotalCount(operatingRegionsResults.length + totalRegularAlerts);
      setHasMore(isAuthenticated && sortedAllAlerts.length < (operatingRegionsResults.length + totalRegularAlerts));
      setPage(1);
    } catch (error) {
      console.error('Error fetching alerts:', error);
<<<<<<< HEAD
      setSnackbar({
        open: true,
        message: 'Failed to fetch alerts',
        severity: 'error'
      });
=======
      showToast('Failed to fetch alerts', 'error');
>>>>>>> 2945eb6 (Initial commit)
      setAlerts([]);
      setTotalCount(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filters, userProfile, fetchOperatingRegionAlerts, sortAlertsByFilter]);

  // Socket.io connection setup
  useEffect(() => {
    // Connect to Socket.io server
    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tourprism-backend-w5c1.onrender.com';
    socketRef.current = io(SOCKET_URL);

    // Connection event handlers
    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.io server');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
    });

    // Alert events
    socketRef.current.on('alert:created', (data) => {
      console.log('New alert created:', data);
      
      // Check if we need to refresh operating region alerts
      const operatingRegions = userProfile?.company?.MainOperatingRegions ?? [];
      const hasOperatingRegions = isAuthenticated && operatingRegions.length > 0;
      
      if (hasOperatingRegions) {
        // Refresh operating region alerts
        fetchOperatingRegionAlerts().then(() => {
          if (city && coords) {
            fetchLocationAlerts(city, coords);
          }
        });
      } else if (city && coords) {
        fetchLocationAlerts(city, coords);
      }
      
<<<<<<< HEAD
      setSnackbar({
        open: true,
        message: 'A new alert has been added',
        severity: 'info'
      });
=======
      showToast('A new alert has been added', 'success');
>>>>>>> 2945eb6 (Initial commit)
    });

    // Similar updates for other socket events that change alerts
    socketRef.current.on('alert:updated', (data) => {
      console.log('Alert updated:', data);
      
      // Check if this alert is in our operating region alerts
      const isInOperatingRegions = operatingRegionAlerts.some(alert => alert._id === data.alertId);
      
      if (isInOperatingRegions) {
        // Refresh operating region alerts
        fetchOperatingRegionAlerts().then(() => {
          // Update the current alert in the main alerts list
          setAlerts(prevAlerts =>
            prevAlerts.map(alert =>
              alert._id === data.alertId
                ? { ...alert, ...data.alert }
                : alert
            )
          );
        });
      } else {
        // Just update this alert in the main list
        setAlerts(prevAlerts =>
          prevAlerts.map(alert =>
            alert._id === data.alertId
              ? { ...alert, ...data.alert }
              : alert
          )
        );
      }
      
<<<<<<< HEAD
      setSnackbar({
        open: true,
        message: 'An alert has been updated',
        severity: 'info'
      });
=======
      showToast('An alert has been updated', 'success');
>>>>>>> 2945eb6 (Initial commit)
    });

    socketRef.current.on('alerts:bulk-created', (data) => {
      console.log('Bulk alerts created:', data);
      
      // Check if we need to refresh operating region alerts
      const operatingRegions = userProfile?.company?.MainOperatingRegions ?? [];
      const hasOperatingRegions = isAuthenticated && operatingRegions.length > 0;
      
      if (hasOperatingRegions) {
        // Refresh operating region alerts
        fetchOperatingRegionAlerts().then(() => {
          if (city && coords) {
            fetchLocationAlerts(city, coords);
          }
        });
      } else if (city && coords) {
        fetchLocationAlerts(city, coords);
      }
      
<<<<<<< HEAD
      setSnackbar({
        open: true,
        message: `${data.count} new alerts have been added`,
        severity: 'info'
      });
=======
      showToast(`${data.count} new alerts have been added`, 'success');
>>>>>>> 2945eb6 (Initial commit)
    });

    // Add these event handlers back after the 'alert:updated' handler
    socketRef.current.on('alert:deleted', (data) => {
      console.log('Alert deleted:', data);
      
      // Check if this alert is in our operating region alerts
      const isInOperatingRegions = operatingRegionAlerts.some(alert => alert._id === data.alertId);
      
      if (isInOperatingRegions) {
        // Refresh operating region alerts
        fetchOperatingRegionAlerts().then(() => {
          // Remove the alert from the main list
          setAlerts(prevAlerts => prevAlerts.filter(alert => alert._id !== data.alertId));
        });
      } else {
        // Just remove from main list
        setAlerts(prevAlerts => prevAlerts.filter(alert => alert._id !== data.alertId));
      }
      
<<<<<<< HEAD
      setSnackbar({
        open: true,
        message: 'An alert has been removed',
        severity: 'info'
      });
=======
      showToast('An alert has been removed', 'success');
>>>>>>> 2945eb6 (Initial commit)
    });

    socketRef.current.on('alert:followed', (data) => {
      console.log('Alert follow status changed:', data);
      setAlerts(prevAlerts =>
        prevAlerts.map(alert =>
          alert._id === data.alertId ?
            {
              ...alert,
              numberOfFollows: data.numberOfFollows,
              isFollowing: data.following
            } :
            alert
        )
      );
      
      // Also update operating region alerts if this is in that list
      const isInOperatingRegions = operatingRegionAlerts.some(alert => alert._id === data.alertId);
      if (isInOperatingRegions) {
        setOperatingRegionAlerts(prevAlerts =>
          prevAlerts.map(alert =>
            alert._id === data.alertId ?
              {
                ...alert,
                numberOfFollows: data.numberOfFollows,
                isFollowing: data.following
              } :
              alert
          )
        );
      }
    });

    // Add socket event handler for flag alerts
    socketRef.current.on('alert:flagged', (data) => {
      console.log('Alert flag status changed:', data);
      setAlerts(prevAlerts =>
        prevAlerts.map(alert =>
          alert._id === data.alertId ?
            {
              ...alert,
              flagged: data.flagged
            } :
            alert
        )
      );
      
      // Also update operating region alerts if this is in that list
      const isInOperatingRegions = operatingRegionAlerts.some(alert => alert._id === data.alertId);
      if (isInOperatingRegions) {
        setOperatingRegionAlerts(prevAlerts =>
          prevAlerts.map(alert =>
            alert._id === data.alertId ?
              {
                ...alert,
                flagged: data.flagged
              } :
              alert
          )
        );
      }
    });

    // Other socket event handlers...

    // Cleanup on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [city, coords, fetchLocationAlerts, isAuthenticated, userProfile, operatingRegionAlerts, fetchOperatingRegionAlerts]);


  const handleLocationSuccess = useCallback(async (position: GeolocationPosition, highAccuracy = true) => {
    const { latitude, longitude } = position.coords;
    const accuracy = position.coords.accuracy;

    // Store the location accuracy for potential warnings
    setLocationAccuracy(accuracy);

    // Show low accuracy warning if accuracy is worse than 100 meters
    const hasLowAccuracy = accuracy > 100;
    if (!highAccuracy || hasLowAccuracy) {
      setLowAccuracyWarning(true);
    }

    try {
      const cityName = await getCityFromCoordinates(latitude, longitude);
      localStorage.setItem('selectedCity', cityName);
      localStorage.setItem('selectedLat', latitude.toString());
      localStorage.setItem('selectedLng', longitude.toString());
      localStorage.setItem('locationAccuracy', accuracy.toString());

      setCity(cityName);
      setCoords({ latitude, longitude });
      setLocationConfirmed(true);

      fetchLocationAlerts(cityName, { latitude, longitude });

    } catch (error) {
      setLocationError('Failed to get your city name. Please try again or select a city manually.');
      console.error('Error in reverse geocoding:', error);
    }
  }, [fetchLocationAlerts]); // Add fetchLocationAlerts as a dependency

  const handleUseMyLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      localStorage.removeItem('isDefaultLocation'); // Clear default location flag
      const position = await getHighAccuracyLocation(true);
      await handleLocationSuccess(position, true);
    } catch (error) {
      console.error('Error in handleUseMyLocation:', error);
      try {
        // Fall back to low accuracy if high accuracy fails
        const position = await getHighAccuracyLocation(false);
        await handleLocationSuccess(position, false);
      } catch (error) {
        const geolocationError = error as GeolocationPositionError;
        handleLocationError(geolocationError);
      }
    } finally {
      setLocationLoading(false);
    }
  }, [handleLocationSuccess]); // Added handleLocationSuccess to dependencies


  const handleSelectEdinburgh = useCallback(() => {
    const edinburghCoords = { latitude: 55.9533, longitude: -3.1883 };

    localStorage.setItem('selectedCity', 'Edinburgh');
    localStorage.setItem('selectedLat', edinburghCoords.latitude.toString());
    localStorage.setItem('selectedLng', edinburghCoords.longitude.toString());
    localStorage.setItem('isDefaultLocation', 'true'); // Mark as default location

    setCity('Edinburgh');
    setCoords(edinburghCoords);
    setLocationConfirmed(true);

    fetchLocationAlerts('Edinburgh', edinburghCoords);
  }, [fetchLocationAlerts])

  useEffect(() => {
    // Check if we have stored location
    const storedCity = localStorage.getItem('selectedCity');
    const storedLat = localStorage.getItem('selectedLat');
    const storedLng = localStorage.getItem('selectedLng');

    if (storedCity && storedLat && storedLng) {
      // Use stored location if available
      setCity(storedCity);
      setCoords({
        latitude: parseFloat(storedLat),
        longitude: parseFloat(storedLng)
      });
      setLocationConfirmed(true);
    } else {
      handleSelectEdinburgh();
    }
  }, [handleSelectEdinburgh]);

  useEffect(() => {
    if (locationConfirmed && city && coords && profileLoaded) {
      fetchLocationAlerts(city, coords);
    }
  }, [city, coords, locationConfirmed, isAuthenticated, fetchLocationAlerts, profileLoaded]);

  const handleFollowUpdate = async (alertId: string) => {
    if (!isAuthenticated) {
<<<<<<< HEAD
      setLoginDialogOpen(true);
=======
      // Show toast instead of opening login dialog
      showToast('Create free account to follow alerts', 'error');
>>>>>>> 2945eb6 (Initial commit)
      return;
    }

    try {
      const response = await followAlert(alertId);
      setAlerts(prevAlerts =>
        prevAlerts.map(alert =>
          alert._id === alertId ?
            {
              ...alert,
              numberOfFollows: response.numberOfFollows,
              isFollowing: response.following
            } :
            alert
        )
      );

<<<<<<< HEAD
      setSnackbar({
        open: true,
        message: response.following ? 'You are now following this alert' : 'You have unfollowed this alert',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error following alert:', error);
      setSnackbar({
        open: true,
        message: 'Failed to follow the alert',
        severity: 'error'
      });
=======
      showToast(response.following ? 'You are now following this alert' : 'You have unfollowed this alert', 'success');
    } catch (error) {
      console.error('Error following alert:', error);
      showToast('Failed to follow the alert', 'error');
>>>>>>> 2945eb6 (Initial commit)
    }
  };

  const handleFlagAlert = async (alertId: string) => {
    if (!isAuthenticated) {
      setLoginDialogOpen(true);
      return;
    }

    try {
      const response = await flagAlert(alertId);
      setAlerts(prevAlerts =>
        prevAlerts.map(alert =>
          alert._id === alertId ?
            {
              ...alert,
              flagged: response.flagged,
              flagCount: response.flagCount
            } :
            alert
        )
      );

<<<<<<< HEAD
      setSnackbar({
        open: true,
        message: response.flagged ? 'Alert has been flagged' : 'Flag has been removed from this alert',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error flagging alert:', error);
      setSnackbar({
        open: true,
        message: 'Failed to flag the alert',
        severity: 'error'
      });
=======
      showToast(response.flagged ? 'Alert has been flagged' : 'Flag has been removed from this alert', 'success');
    } catch (error) {
      console.error('Error flagging alert:', error);
      showToast('Failed to flag the alert', 'error');
>>>>>>> 2945eb6 (Initial commit)
    }
  };

  const formatTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays}d ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}m ago`;
  };

  const getHighAccuracyLocation = (highAccuracy = true) => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      const options = {
        enableHighAccuracy: highAccuracy,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        options
      );
    });
  };


  const handleLocationError = (error: GeolocationPositionError) => {
    console.error('Geolocation error:', error);

    switch (error.code) {
      case error.PERMISSION_DENIED:
        setLocationError("You denied access to your location. Please enable location services or select a city manually.");
        break;
      case error.POSITION_UNAVAILABLE:
        setLocationError("Location information is unavailable. Please try again or select a city manually.");
        break;
      case error.TIMEOUT:
        setLocationError("The request to get your location timed out. Please try again or select a city manually.");
        break;
      default:
        setLocationError("An unknown error occurred while getting your location. Please try again or select a city manually.");
    }
  };

  const handleContinueWithLocation = () => {
    if (!city || !coords) {
      handleSelectEdinburgh();
      return;
    }

    localStorage.setItem('selectedCity', city);
    localStorage.setItem('selectedLat', coords.latitude.toString());
    localStorage.setItem('selectedLng', coords.longitude.toString());

    // Confirm location and fetch alerts
    setLocationConfirmed(true);
    fetchLocationAlerts(city, coords);
  };
  const handleLogin = () => {
    router.push('/login');
  };

  const handleCloseLoginDialog = () => {
    setLoginDialogOpen(false);
  };

<<<<<<< HEAD
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

=======
>>>>>>> 2945eb6 (Initial commit)
  const handleLoadMore = () => {
    if (isAuthenticated) {
      loadMoreAlerts();
    } else {
      setLoginDialogOpen(true);
    }
  };


  const loadMoreAlerts = async () => {
    if (!hasMore || loading || !isAuthenticated) return;

    const nextPage = page + 1;
    setLoading(true);

    try {
      // Check if we have operating regions
      const operatingRegions = userProfile?.company?.MainOperatingRegions ?? [];
      const hasOperatingRegions = isAuthenticated && operatingRegions.length > 0;
      
      // Skip default Edinburgh location if we have operating regions and the current location is Edinburgh
      const isDefaultEdinburgh = 
        city === "Edinburgh" && 
        coords?.latitude === 55.9533 && 
        coords?.longitude === -3.1883;
      
      const skipDefaultLocation = hasOperatingRegions && isDefaultEdinburgh;

      // When loading more, we should only fetch additional location-based alerts
      // Operating region alerts are already loaded
      if (!skipDefaultLocation) {
        const params: Record<string, unknown> = {
          page: nextPage,
          limit: 10,
          sortBy: filters.sortBy,
        };
        
        if (filters.timeRange > 0) {
          const now = new Date();
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + filters.timeRange);

          params.startDate = now.toISOString();
          params.endDate = futureDate.toISOString();
<<<<<<< HEAD
        }
        
        if (filters.incidentTypes && filters.incidentTypes.length > 0) {
          params.incidentTypes = filters.incidentTypes;
=======
        } else if (filters.timeRange === -1 && filters.customDateFrom && filters.customDateTo) {
          // Handle custom date range
          params.startDate = new Date(filters.customDateFrom).toISOString();
          params.endDate = new Date(filters.customDateTo).toISOString();
        }
        
        if (filters.alertCategory && filters.alertCategory.length > 0) {
          params.alertCategory = filters.alertCategory;
>>>>>>> 2945eb6 (Initial commit)
        }
        
        if (coords) {
          params.latitude = coords.latitude;
          params.longitude = coords.longitude;
          if (filters.distance && filters.distance > 0) {
            params.distance = filters.distance;
          }
        } else if (city) {
          params.city = city;
        }

        // We've already loaded operating region alerts in the first page
        // Now just load regular location-based alerts for pagination
        const response = await fetchAlerts(params);
        
        // Create a map of all alerts we already have
        const alertMap = new Map(alerts.map(alert => [alert._id, alert]));
        
        // Filter out alerts we already have
        const newUniqueAlerts = response.alerts.filter(alert => !alertMap.has(alert._id));
        
        if (newUniqueAlerts.length < response.alerts.length) {
          console.warn(`Filtered out ${response.alerts.length - newUniqueAlerts.length} duplicate alert(s)`);
        }

        // Add new alerts to our existing list
        setAlerts(prevAlerts => [...prevAlerts, ...newUniqueAlerts]);
        
        // Calculate hasMore accounting for operating region alerts and already loaded alerts
        const operatingRegionCount = hasOperatingRegions ? operatingRegionAlerts.length : 0;
        const totalAlertsLoaded = alerts.length + newUniqueAlerts.length;
        const totalExpected = operatingRegionCount + response.totalCount;
        
        setHasMore(totalAlertsLoaded < totalExpected);
        setPage(nextPage);
      } else {
        // If we're skipping the default location, there's nothing more to load
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more alerts:', error);
<<<<<<< HEAD
      setSnackbar({
        open: true,
        message: 'Failed to load more alerts',
        severity: 'error'
      });
=======
      showToast('Failed to load more alerts', 'error');
>>>>>>> 2945eb6 (Initial commit)
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setIsFilterDrawerOpen(false);
    if (city && coords) {
      fetchLocationAlerts(city, coords);
    } else if (city) {
      fetchLocationAlerts(city);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      sortBy: 'newest',
<<<<<<< HEAD
      incidentTypes: [],
      timeRange: 0,
      distance: 50
=======
      alertCategory: [],
      timeRange: 0,
      distance: 50,
      impactLevel: '',
      customDateFrom: new Date(),
      customDateTo: new Date(),
>>>>>>> 2945eb6 (Initial commit)
    });
  };

  const getCityFromCoordinates = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await response.json();

      if (data.address) {
        return data.address.city || data.address.town || data.address.village || 'Unknown location';
      }
      return 'Unknown location';
    } catch (error) {
      console.error('Error getting location name:', error);
      return 'Unknown location';
    }
  };

  const handleResetLocation = useCallback(() => {
    localStorage.removeItem('selectedCity');
    localStorage.removeItem('selectedLat');
    localStorage.removeItem('selectedLng');
    localStorage.removeItem('locationAccuracy');

    setCity('Edinburgh');
    setCoords({ latitude: 55.9533, longitude: -3.1883 });
    setLocationAccuracy(null);
    setLocationConfirmed(true);

    fetchLocationAlerts('Edinburgh', { latitude: 55.9533, longitude: -3.1883 });
  }, [fetchLocationAlerts]);

  // Function to format remainingTime from countdown
  const formatRemainingTime = ({ days, hours, minutes, seconds }: { days: number, hours: number, minutes: number, seconds: number }) => {
    // Negative values indicate the event has already passed
    const isExpired = days < 0 || (days === 0 && hours < 0) || (days === 0 && hours === 0 && minutes < 0);

    // Convert negative values to positive for display
    const absDays = Math.abs(days);
    const absHours = Math.abs(hours);
    const absMinutes = Math.abs(minutes);
    const absSeconds = Math.abs(seconds);

    if (isExpired) {
      // Format as "Xd ago", "Xh ago", etc.
      if (absDays > 0) {
        return `${absDays}d ago`;
      } else if (absHours > 0) {
        return `${absHours}h ago`;
      } else if (absMinutes > 0) {
        return `${absMinutes}m ago`;
      } else {
        return `${absSeconds}s ago`;
      }
    } else {
      // Format as "Xd", "Xh", etc. for future events
      if (days > 0) {
        return `${days}d`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else if (minutes > 0) {
        return `${minutes}m`;
      } else {
        return `${seconds}s`;
      }
    }
  };


  if (!locationConfirmed) {
    return (
      <Layout>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            {city ? 'Change Your Location' : 'Choose Your Location'}
          </Typography>

          <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
            {city
              ? `Currently showing alerts for ${city}. Select a new location or continue with the current one.`
              : 'To show relevant alerts, please select a location.'
            }
          </Typography>

          {locationError && (
            <MuiAlert severity="error" sx={{ mb: 3, width: '100%', maxWidth: 500 }}>
              {locationError}
            </MuiAlert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 500 }}>
            <Button
              variant="contained"
              onClick={handleUseMyLocation}
              disabled={locationLoading}
              startIcon={locationLoading && <CircularProgress size={20} color="inherit" />}
              sx={{
                bgcolor: 'black',
                color: 'white',
                '&:hover': { bgcolor: '#333' },
                py: 1.5,
                borderRadius: 3
              }}
            >
              {locationLoading ? 'Getting location...' : 'Use my current location'}
            </Button>

            <Button
              variant="outlined"
              onClick={handleSelectEdinburgh}
              sx={{
                borderColor: 'black',
                color: 'black',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                py: 1.5,
                borderRadius: 3
              }}
            >
              Use Edinburgh as location
            </Button>

            {city && coords && (
              <Button
                variant="contained"
                onClick={handleContinueWithLocation}
                sx={{
                  bgcolor: 'black',
                  color: 'white',
                  '&:hover': { bgcolor: '#333' },
                  py: 1.5,
                  borderRadius: 3,
                  mt: 2
                }}
              >
                Continue with {city}
              </Button>
            )}
          </Box>
        </Box>
      </Layout>
    );
  }

  return (
<<<<<<< HEAD
    <Layout onFilterOpen={() => isAuthenticated ? setIsFilterDrawerOpen(true) : setLoginDialogOpen(true)}>
=======
    <Layout onFilterOpen={() => setIsFilterDrawerOpen(true)}>
>>>>>>> 2945eb6 (Initial commit)
      <Container maxWidth="xl">
        {/* Low Accuracy Warning Dialog */}
        <Dialog
          open={lowAccuracyWarning}
          onClose={() => setLowAccuracyWarning(false)}
          PaperProps={{
            sx: {
              borderRadius: 1,
              boxShadow: 'none',
              maxWidth: '600px',
              width: '100%'
            }
          }}
        >
          <DialogTitle sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 2
          }}>
            <Typography variant="h6" sx={{ fontWeight: 500, color: '#000' }}>
              Location Accuracy Notice
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 1, color: '#777' }}>
              Your location could only be determined with low accuracy
              {locationAccuracy ? ` (${Math.round(locationAccuracy)} meters).` : '.'}
              This might be because you&apos;re on a desktop computer, using a VPN, or your device&apos;s GPS is disabled.
            </Typography>

            <Typography variant="subtitle1" sx={{ color: '#777' }}>
              For more accurate location:
            </Typography>
            <li style={{ color: '#777' }}>
              On mobile, ensure GPS is enabled
            </li>
            <li style={{ color: '#777' }}>
              Allow precise location in browser permissions
            </li>
            <li style={{ color: '#777' }}>
              Disable VPN if you&apos;re using one
            </li>

            <Typography variant="body2" sx={{ mt: 2, color: '#777' }}>
              Would you like to continue with this approximate location or try again?
            </Typography>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, pt: 1, flexDirection: { xs: 'row', sm: 'row' }, gap: 1 }}>
            <Typography
              onClick={() => {
                setLowAccuracyWarning(false);
              }}
              sx={{
                color: 'rgb(42, 99, 185)',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Use Current Accuracy
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                setLowAccuracyWarning(false);
                handleUseMyLocation()
              }}
              sx={{
                bgcolor: 'rgb(42, 99, 185)',
                color: 'white',
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'rgb(42, 99, 185)',
                },
              }}
            >
              Try Again
            </Button>
          </DialogActions>
        </Dialog>

        {/* Alerts List */}
        {loading && alerts.length === 0 ? (
          // Skeleton loading
          Array.from(new Array(3)).map((_, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', mb: 1 }}>
                <Skeleton variant="text" width="70%" />
              </Box>
              <Box sx={{ display: 'flex', mb: 2, gap: 1 }}>
                <Skeleton variant="text" width="15%" />
                <Skeleton variant="text" width="25%" />
                <Skeleton variant="text" width="20%" />
              </Box>
              <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton variant="text" width={100} />
                <Skeleton variant="rectangular" width={120} height={30} />
              </Box>
            </Paper>
          ))
        ) : alerts.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <i className="ri-file-list-3-line" style={{ fontSize: 48, color: '#ccc' }}></i>
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              No alerts found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              There are no safety alerts in this area yet. Change your location or filters to see more results.
            </Typography>
          </Paper>
        ) : (
          <>
<<<<<<< HEAD
            {alerts.map((alert: AlertType, index: number) => (
              <Paper 
                key={`alert-${alert._id}-${index}`} 
                sx={{ 
                  py: 0.5, 
                  bgcolor: '#f5f5f5', 
                  borderRadius: 2, 
                  boxShadow: 'none',
                  position: 'relative',
                  borderLeft: 'none',
                  pl: 0
                }}
              >
                
                {/* Alert Header */}
                <Typography variant="subtitle1" sx={{ fontWeight: 500, fontSize: { xs: '14px', md: '16px' } }}>
                  {alert.title || ""}
                </Typography>

                {/* Alert Metadata */}
                <Box sx={{ display: 'flex', gap: 1, color: 'text.secondary', fontSize: '0.75rem', mb: 0.5 }}>
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {getCategoryIcon(alert.alertCategory || "")}
                    {alert.alertCategory || ""}
                  </Box>
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M11.167 4.66667C11.167 6.24543 10.0117 7.55436 8.50033 7.79408L8.50033 12C8.50033 12.2761 8.27647 12.5 8.00033 12.5C7.72418 12.5 7.50033 12.2761 7.50033 12L7.50033 7.79408C5.989 7.55436 4.83366 6.24543 4.83366 4.66667C4.83366 2.91777 6.25142 1.5 8.00033 1.5C9.74923 1.5 11.167 2.91777 11.167 4.66667ZM8.00033 2.5C6.80371 2.5 5.83366 3.47005 5.83366 4.66667C5.83366 5.86328 6.80371 6.83333 8.00033 6.83333C9.19694 6.83333 10.167 5.86328 10.167 4.66667C10.167 3.47005 9.19694 2.5 8.00033 2.5Z" fill="#757575" />
                      <path d="M5.16699 12.6667C5.16699 12.3905 4.94313 12.1667 4.66699 12.1667C4.39085 12.1667 4.16699 12.3905 4.16699 12.6667C4.16699 13.0325 4.35443 13.3305 4.58539 13.5489C4.81529 13.7664 5.12114 13.9391 5.45761 14.0737C6.13332 14.344 7.03253 14.5 8.00033 14.5C8.96813 14.5 9.86733 14.344 10.543 14.0737C10.8795 13.9391 11.1854 13.7664 11.4153 13.5489C11.6462 13.3305 11.8337 13.0325 11.8337 12.6667C11.8337 12.3905 11.6098 12.1667 11.3337 12.1667C11.0575 12.1667 10.8337 12.3905 10.8337 12.6667C10.8337 12.6697 10.8338 12.7225 10.7282 12.8224C10.6207 12.924 10.4384 13.0385 10.1717 13.1452C9.64094 13.3575 8.87347 13.5 8.00033 13.5C7.12718 13.5 6.35971 13.3575 5.829 13.1452C5.56225 13.0385 5.37994 12.924 5.2725 12.8224C5.16686 12.7225 5.16699 12.6697 5.16699 12.6667Z" fill="#757575" />
                    </svg>

                    {alert.city || "EdinBurgh"}
                  </Box>

                  {/* Display expected end date with countdown if available, otherwise show createdAt */}
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.49967 5.33334C8.49967 5.05719 8.27582 4.83334 7.99967 4.83334C7.72353 4.83334 7.49967 5.05719 7.49967 5.33334V8C7.49967 8.13261 7.55235 8.25979 7.64612 8.35356L8.97945 9.68689C9.17472 9.88215 9.4913 9.88215 9.68656 9.68689C9.88182 9.49163 9.88182 9.17505 9.68656 8.97978L8.49967 7.7929V5.33334Z" fill="#757575" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M7.99967 0.833336C4.04163 0.833336 0.833008 4.04196 0.833008 8C0.833008 11.958 4.04163 15.1667 7.99967 15.1667C11.9577 15.1667 15.1663 11.958 15.1663 8C15.1663 4.04196 11.9577 0.833336 7.99967 0.833336ZM1.83301 8C1.83301 4.59425 4.59392 1.83334 7.99967 1.83334C11.4054 1.83334 14.1663 4.59425 14.1663 8C14.1663 11.4058 11.4054 14.1667 7.99967 14.1667C4.59392 14.1667 1.83301 11.4058 1.83301 8Z" fill="#757575" />
                    </svg>

                    {alert.expectedEnd ? (
                      alert.expectedStart ? (
                        // Display both expected start and end dates
                        <span>{formatDateForDisplay(alert.expectedStart)} - {formatDateForDisplay(alert.expectedEnd)}</span>
                      ) : (
                        /* Live countdown timer for end date only */
                        <Countdown
                          date={new Date(alert.expectedEnd || '')}
                          renderer={props => {
                            // Check if date is in the past
                            if (props.completed) {
                              // For expired events, use the "Xd ago" format
                              const now = new Date();
                              const endDate = new Date(alert.expectedEnd || '');
                              const diffMs = now.getTime() - endDate.getTime();
                              
                              // Convert ms difference to days, hours, minutes, seconds
                              const diffSecs = Math.floor(diffMs / 1000);
                              const days = -Math.floor(diffSecs / (24 * 60 * 60));
                              const hours = -Math.floor((diffSecs % (24 * 60 * 60)) / (60 * 60));
                              const minutes = -Math.floor((diffSecs % (60 * 60)) / 60);
                              const seconds = -Math.floor(diffSecs % 60);
                              
                              return <span>{formatRemainingTime({ days, hours, minutes, seconds })}</span>;
                            } else {
                              return <span>{formatRemainingTime(props)}</span>;
                            }
                          }}
                        />
                      )
                    ) : (
                      <span>{alert.createdAt ? formatTime(alert.createdAt) : ""}</span>
                    )}
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mb: 1, fontSize: { xs: '14px', md: '14px' } }}>
                  {alert.description || ""}
                  {alert.recommendedAction && ` ${alert.recommendedAction}`}
                </Typography>
                {(alert.risk) && (
                  <Chip
                    label={alert.risk}
                    sx={{
                      mb: 1,
                      backgroundColor:
                        alert.risk === 'Low' ? '#e6f4ea' :
                          alert.risk === 'Medium' ? '#fff4e5' :
                            alert.risk === 'High' ? '#fdecea' :
                              'transparent',
                      color:
                        alert.risk === 'Low' ? '#00855b' :
                          alert.risk === 'Medium' ? '#c17e00' :
                            alert.risk === 'High' ? '#d32f2f' :
                              'inherit',
                      fontWeight: 500,
                      fontSize: '14px',
                      borderRadius: 10,
                      paddingX: '8px',
                      paddingY: '2px',
                    }}
                  />
                )}


                {/* Update Time and Follow Text */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>
                    Updated {alert.updated ? formatTime(alert.updated) : formatTime(alert.updatedAt)}
                  </Typography>

                  {/* Use text with bell icon instead of button */}
                  <i className="ri-circle-fill" style={{ fontSize: '5px', color: '#777' }}></i>
                  <Box
                    onClick={() => isViewOnly() ? null : handleFollowUpdate(alert._id || '')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      cursor: 'pointer',
                      color: alert.isFollowing ? 'primary.main' : 'text.secondary',
                      fontWeight: alert.isFollowing ? 500 : 400,
                      '&:hover': { color: `isViewOnly() ? 'text.secondary' : 'primary.main'` },
                      opacity: isViewOnly() ? 0.5 : 1
                    }}
                  >
                    {alert.isFollowing ? (
                      <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M6.99968 0.833374C4.02913 0.833374 1.61827 3.22772 1.61825 6.18468C1.61818 6.87247 1.57193 7.39159 1.25481 7.85817C1.21072 7.9221 1.15222 8.00217 1.0883 8.08966C0.977267 8.24164 0.849859 8.41603 0.753231 8.56704C0.582689 8.83357 0.416071 9.15498 0.358792 9.5295C0.171916 10.7514 1.03338 11.5425 1.89131 11.897C2.44899 12.1274 3.04588 12.3153 3.6675 12.4606C3.6634 12.5298 3.6701 12.6008 3.68887 12.6714C4.07359 14.1191 5.42024 15.1669 6.99984 15.1669C8.57944 15.1669 9.92609 14.1191 10.3108 12.6714C10.3296 12.6008 10.3363 12.5298 10.3322 12.4606C10.9537 12.3152 11.5505 12.1273 12.108 11.897C12.966 11.5425 13.8274 10.7514 13.6406 9.5295C13.5833 9.15499 13.4167 8.83357 13.2461 8.56704C13.1495 8.41604 13.0221 8.2417 12.9111 8.08972C12.8472 8.00224 12.7887 7.92215 12.7446 7.85822C12.4274 7.39162 12.3812 6.87256 12.3811 6.18473C12.3811 3.22774 9.97023 0.833374 6.99968 0.833374ZM8.87123 12.7193C7.63997 12.8714 6.35974 12.8714 5.12847 12.7193C5.4664 13.3728 6.17059 13.8335 6.99984 13.8335C7.82911 13.8335 8.53331 13.3727 8.87123 12.7193Z" fill="black" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M8.00012 0.833328C4.95497 0.833328 2.48355 3.29418 2.48353 6.33329C2.48347 7.04018 2.43605 7.57372 2.11097 8.05325C2.06577 8.11897 2.00579 8.20127 1.94026 8.2912C1.82644 8.4474 1.69585 8.62661 1.59679 8.78182C1.42197 9.05575 1.25116 9.38609 1.19245 9.77101C1.00088 11.0268 1.88398 11.8399 2.76346 12.2042C3.4182 12.4755 4.12567 12.6894 4.86357 12.8459C5.24629 14.1929 6.51269 15.1666 7.99947 15.1666C9.48615 15.1666 10.7525 14.1931 11.1353 12.8462C11.8737 12.6896 12.5816 12.4756 13.2368 12.2042C14.1162 11.8399 14.9994 11.0268 14.8078 9.77101C14.7491 9.3861 14.5783 9.05576 14.4034 8.78182C14.3044 8.62662 14.1738 8.44741 14.06 8.29121C13.9945 8.20131 13.9345 8.11901 13.8893 8.05331C13.5642 7.57375 13.5168 7.04027 13.5167 6.33333C13.5167 3.2942 11.0453 0.833328 8.00012 0.833328ZM3.48353 6.33333C3.48353 3.84961 5.50411 1.83333 8.00012 1.83333C10.4961 1.83333 12.5167 3.84965 12.5167 6.33337C12.5168 7.05499 12.5524 7.86444 13.0627 8.61613L13.0643 8.61847C13.1482 8.74056 13.2219 8.84064 13.2913 8.93497C13.3838 9.06063 13.4688 9.17611 13.5605 9.3198C13.7026 9.54255 13.7908 9.73558 13.8192 9.92181C13.9112 10.5247 13.5266 11.0017 12.8541 11.2804C10.0014 12.4621 5.99882 12.4621 3.14618 11.2804C2.47358 11.0017 2.08904 10.5247 2.18101 9.92181C2.20942 9.73558 2.29759 9.54255 2.43975 9.3198C2.53145 9.17611 2.61643 9.06065 2.70891 8.935C2.77824 8.8408 2.85215 8.74036 2.93592 8.61848L2.93752 8.61613C3.44788 7.86444 3.48347 7.05495 3.48353 6.33333ZM9.9754 13.0422C8.67637 13.2082 7.32244 13.2081 6.02345 13.0421C6.40445 13.7079 7.14181 14.1666 7.99947 14.1666C8.85706 14.1666 9.59436 13.708 9.9754 13.0422Z" fill="#616161" />
                      </svg>

                    )}
                    <Typography variant="body2" sx={{ fontSize: { xs: '12px', md: '14px' } }}>
                      {alert.isFollowing ? 'Following' : 'Follow Updates'}
                    </Typography>
                  </Box>
                  
                  {/* Flag Button */}
                  {location.pathname === '/feedfsaf' && (
                    <>
                      <i className="ri-circle-fill" style={{ fontSize: '5px', color: '#777' }}></i>
                      <Box
                        onClick={() => handleFlagAlert(alert._id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      cursor: 'pointer',
                      color: alert.flagged ? 'error.main' : 'text.secondary',
                      fontWeight: alert.flagged ? 500 : 400,
                      '&:hover': { color: 'error.main' }
                    }}
                  >
                    {alert.flagged ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M1.75 1.75C1.75 1.33579 2.08579 1 2.5 1C2.91421 1 3.25 1.33579 3.25 1.75V12.25C3.25 12.6642 2.91421 13 2.5 13C2.08579 13 1.75 12.6642 1.75 12.25V1.75ZM3.25 2.5C3.25 2.08579 3.58579 1.75 4 1.75H11.2757C11.8627 1.75 12.1934 2.44905 11.8119 2.89107L8.6362 6.5L11.8119 10.1089C12.1934 10.551 11.8627 11.25 11.2757 11.25H4C3.58579 11.25 3.25 10.9142 3.25 10.5V2.5Z" fill="#d32f2f"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M1.75 1.75C1.75 1.33579 2.08579 1 2.5 1C2.91421 1 3.25 1.33579 3.25 1.75V12.25C3.25 12.6642 2.91421 13 2.5 13C2.08579 13 1.75 12.6642 1.75 12.25V1.75ZM3.25 2.5C3.25 2.08579 3.58579 1.75 4 1.75H11.2757C11.8627 1.75 12.1934 2.44905 11.8119 2.89107L8.6362 6.5L11.8119 10.1089C12.1934 10.551 11.8627 11.25 11.2757 11.25H4C3.58579 11.25 3.25 10.9142 3.25 10.5V2.5ZM4.75 3.25V9.75H9.72431L7.1381 6.83911C6.92356 6.59443 6.92356 6.40557 7.1381 6.16089L9.72431 3.25H4.75Z" fill="#616161"/>
                      </svg>
                    )}
                    <Typography variant="body2" sx={{ fontSize: { xs: '12px', md: '14px' } }}>
                      {alert.flagged ? 'Flagged' : 'Flag'}
                    </Typography>
                  </Box>
                  </>
                  )}
                </Box>
                <Divider sx={{ my: 1 }} />
              </Paper>
            ))}

            {/* Login to view more alerts - for non-logged in users */}
            {!isAuthenticated && alerts.length > 0 && (
              <Box
                sx={{
                  textAlign: 'center',
                  p: 1,
                  mt: 2, // Added margin top for better spacing
                  bgcolor: 'rgb(238, 238, 238)',
                  borderRadius: 5,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'rgb(220, 220, 220)'
                  }
                }}
                onClick={handleLogin}
              >
                <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600, borderRadius: 4 }}>
                  Login to view updates of the alerts!
                </Typography>
              </Box>
            )}
=======
            {/* Restructured grid layout for cards and alerts */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr', 
                sm: 'repeat(2, 1fr)', 
                md: 'repeat(3, 1fr)'
              },
              gap: 2, 
              mt: 2 
            }}>
              {/* First position: Feature Card based on auth state */}
              {isAuthenticated && userProfile && (!userProfile.isProfileComplete) ? (
                <Box sx={{ gridColumn: { xs: '1', sm: '1', md: '1' } }}>
                  <UnlockFeaturesCard 
                    progress={userProfile?.profileCompletionPercentage || 75} 
                    onClick={() => router.push('/profile')} 
                  />
                </Box>
              ) : !isAuthenticated ? (
                <Box sx={{ gridColumn: { xs: '1', sm: '1', md: '1' } }}>
                  <GetAccessCard onClick={handleLogin} />
                </Box>
              ) : (
                // If user is authenticated and profile is complete, show the first alert
                alerts.length > 0 && (
                  <Paper 
                    key={`alert-${alerts[0]._id}-0`} 
                    sx={{ 
                      p: 2,
                      bgcolor: 'white', 
                      borderRadius: 2, 
                      boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #EAEAEA',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* Alert Header with Follow Button */}
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 1.5
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600, 
                        fontSize: '16px',
                        flex: 1
                      }}>
                        {alerts[0].title || ""}
                      </Typography>
                      
                      <Box
                        onClick={() => isViewOnly() ? null : handleFollowUpdate(alerts[0]._id || '')}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          cursor: 'pointer',
                          color: '#0066FF',
                          fontWeight: 500,
                          opacity: isViewOnly() ? 0.5 : 1,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 10,
                          border: '1px solid #E0E0E0',
                          bgcolor: 'transparent',
                          fontSize: '14px',
                          '&:hover': { 
                            bgcolor: 'rgba(0, 0, 0, 0.04)'
                          },
                          ml: 1,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {alerts[0].isFollowing ? (
                          <>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M6.99968 0.833374C4.02913 0.833374 1.61827 3.22772 1.61825 6.18468C1.61818 6.87247 1.57193 7.39159 1.25481 7.85817C1.21072 7.9221 1.15222 8.00217 1.0883 8.08966C0.977267 8.24164 0.849859 8.41603 0.753231 8.56704C0.582689 8.83357 0.416071 9.15498 0.358792 9.5295C0.171916 10.7514 1.03338 11.5425 1.89131 11.897C2.44899 12.1274 3.04588 12.3153 3.6675 12.4606C3.6634 12.5298 3.6701 12.6008 3.68887 12.6714C4.07359 14.1191 5.42024 15.1669 6.99984 15.1669C8.57944 15.1669 9.92609 14.1191 10.3108 12.6714C10.3296 12.6008 10.3363 12.5298 10.3322 12.4606C10.9537 12.3152 11.5505 12.1273 12.108 11.897C12.966 11.5425 13.8274 10.7514 13.6406 9.5295C13.5833 9.15499 13.4167 8.83357 13.2461 8.56704C13.1495 8.41604 13.0221 8.2417 12.9111 8.08972C12.8472 8.00224 12.7887 7.92215 12.7446 7.85822C12.4274 7.39162 12.3812 6.87256 12.3811 6.18473C12.3811 3.22774 9.97023 0.833374 6.99968 0.833374ZM8.87123 12.7193C7.63997 12.8714 6.35974 12.8714 5.12847 12.7193C5.4664 13.3728 6.17059 13.8335 6.99984 13.8335C7.82911 13.8335 8.53331 13.3727 8.87123 12.7193Z" fill="#0066FF" />
                            </svg>
                            <Typography variant="body2">Following</Typography>
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M8.00012 0.833328C4.95497 0.833328 2.48355 3.29418 2.48353 6.33329C2.48347 7.04018 2.43605 7.57372 2.11097 8.05325C2.06577 8.11897 2.00579 8.20127 1.94026 8.2912C1.82644 8.4474 1.69585 8.62661 1.59679 8.78182C1.42197 9.05575 1.25116 9.38609 1.19245 9.77101C1.00088 11.0268 1.88398 11.8399 2.76346 12.2042C3.4182 12.4755 4.12567 12.6894 4.86357 12.8459C5.24629 14.1929 6.51269 15.1666 7.99947 15.1666C9.48615 15.1666 10.7525 14.1931 11.1353 12.8462C11.8737 12.6896 12.5816 12.4756 13.2368 12.2042C14.1162 11.8399 14.9994 11.0268 14.8078 9.77101C14.7491 9.3861 14.5783 9.05576 14.4034 8.78182C14.3044 8.62662 14.1738 8.44741 14.06 8.29121C13.9945 8.20131 13.9345 8.11901 13.8893 8.05331C13.5642 7.57375 13.5168 7.04027 13.5167 6.33333C13.5167 3.2942 11.0453 0.833328 8.00012 0.833328ZM3.48353 6.33333C3.48353 3.84961 5.50411 1.83333 8.00012 1.83333C10.4961 1.83333 12.5167 3.84965 12.5167 6.33337C12.5168 7.05499 12.5524 7.86444 13.0627 8.61613L13.0643 8.61847C13.1482 8.74056 13.2219 8.84064 13.2913 8.93497C13.3838 9.06063 13.4688 9.17611 13.5605 9.3198C13.7026 9.54255 13.7908 9.73558 13.8192 9.92181C13.9112 10.5247 13.5266 11.0017 12.8541 11.2804C10.0014 12.4621 5.99882 12.4621 3.14618 11.2804C2.47358 11.0017 2.08904 10.5247 2.18101 9.92181C2.20942 9.73558 2.29759 9.54255 2.43975 9.3198C2.53145 9.17611 2.61643 9.06065 2.70891 8.935C2.77824 8.8408 2.85215 8.74036 2.93592 8.61848L2.93752 8.61613C3.44788 7.86444 3.48347 7.05495 3.48353 6.33333ZM9.9754 13.0422C8.67637 13.2082 7.32244 13.2081 6.02345 13.0421C6.40445 13.7079 7.14181 14.1666 7.99947 14.1666C8.85706 14.1666 9.59436 13.708 9.9754 13.0422Z" fill="#616161" />
                            </svg>
                            <Typography variant="body2">Follow</Typography>
                          </>
                        )}
                      </Box>
                    </Box>

                    {/* Location & Time info */}
                    <Typography variant="body2" 
                      sx={{ 
                        color: '#616161',
                        fontSize: '14px',
                        mb: 1
                      }}
                    >
                      {alerts[0].city || "Edinburgh"}
                    </Typography>

                    {/* Alert Content */}
                    <Typography variant="body2" sx={{ 
                      mb: 1.5, 
                      color: '#333',
                      flex: 1
                    }}>
                      {alerts[0].description || ""}
                      {alerts[0].recommendedAction && ` ${alerts[0].recommendedAction}`}
                    </Typography>

                    {/* Alert Details */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {/* Start and End Time */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Start: {alerts[0].expectedStart ? formatDateForDisplay(alerts[0].expectedStart) : "06 May 9:00AM"}
                          </Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            End: {alerts[0].expectedEnd ? formatDateForDisplay(alerts[0].expectedEnd) : "06 May 9:00AM"}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Impact Level */}
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ 
                          display: 'inline-block',
                          px: 1.5, 
                          py: 0.5,
                          fontSize: '14px',
                          borderRadius: 1,
                          backgroundColor: alerts[0].risk === 'Low' ? '#e6f4ea' : 
                            alerts[0].risk === 'Medium' || !alerts[0].risk ? '#fff4e5' : 
                            alerts[0].risk === 'High' ? '#fdecea' : 'transparent',
                          color: alerts[0].risk === 'Low' ? '#00855b' : 
                            alerts[0].risk === 'Medium' || !alerts[0].risk ? '#c17e00' : 
                            alerts[0].risk === 'High' ? '#d32f2f' : 'inherit',
                          fontWeight: 500,
                        }}>
                          {alerts[0].risk === 'Medium' || !alerts[0].risk ? 'Moderated Impact' : `${alerts[0].risk} Impact`}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                )
              )}
              
              {/* Render rest of the alerts - starting from index 0 or 1 depending on the first position */}
              {alerts.map((alert: AlertType, index: number) => {
                // Skip rendering if this alert would have been in the first position
                // and we're already showing a card or if we've already rendered it
                const startIndex = (isAuthenticated && userProfile && !userProfile.isProfileComplete) || !isAuthenticated ? 0 : 1;
                
                if (index < startIndex) return null;
                
                return (
                  <Paper 
                    key={`alert-${alert._id}-${index}`} 
                    sx={{ 
                      p: 2,
                      bgcolor: 'white', 
                      borderRadius: 2, 
                      boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #EAEAEA',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* Alert Header with Follow Button */}
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 1.5
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600, 
                        fontSize: '16px',
                        flex: 1
                      }}>
                        {alert.title || ""}
                      </Typography>
                      
                      <Box
                        onClick={() => isViewOnly() ? null : handleFollowUpdate(alert._id || '')}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          cursor: 'pointer',
                          color: '#0066FF',
                          fontWeight: 500,
                          opacity: isViewOnly() ? 0.5 : 1,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 10,
                          border: '1px solid #E0E0E0',
                          bgcolor: 'transparent',
                          fontSize: '14px',
                          '&:hover': { 
                            bgcolor: 'rgba(0, 0, 0, 0.04)'
                          },
                          ml: 1,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {alert.isFollowing ? (
                          <>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M6.99968 0.833374C4.02913 0.833374 1.61827 3.22772 1.61825 6.18468C1.61818 6.87247 1.57193 7.39159 1.25481 7.85817C1.21072 7.9221 1.15222 8.00217 1.0883 8.08966C0.977267 8.24164 0.849859 8.41603 0.753231 8.56704C0.582689 8.83357 0.416071 9.15498 0.358792 9.5295C0.171916 10.7514 1.03338 11.5425 1.89131 11.897C2.44899 12.1274 3.04588 12.3153 3.6675 12.4606C3.6634 12.5298 3.6701 12.6008 3.68887 12.6714C4.07359 14.1191 5.42024 15.1669 6.99984 15.1669C8.57944 15.1669 9.92609 14.1191 10.3108 12.6714C10.3296 12.6008 10.3363 12.5298 10.3322 12.4606C10.9537 12.3152 11.5505 12.1273 12.108 11.897C12.966 11.5425 13.8274 10.7514 13.6406 9.5295C13.5833 9.15499 13.4167 8.83357 13.2461 8.56704C13.1495 8.41604 13.0221 8.2417 12.9111 8.08972C12.8472 8.00224 12.7887 7.92215 12.7446 7.85822C12.4274 7.39162 12.3812 6.87256 12.3811 6.18473C12.3811 3.22774 9.97023 0.833374 6.99968 0.833374ZM8.87123 12.7193C7.63997 12.8714 6.35974 12.8714 5.12847 12.7193C5.4664 13.3728 6.17059 13.8335 6.99984 13.8335C7.82911 13.8335 8.53331 13.3727 8.87123 12.7193Z" fill="#0066FF" />
                            </svg>
                            <Typography variant="body2">Following</Typography>
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M8.00012 0.833328C4.95497 0.833328 2.48355 3.29418 2.48353 6.33329C2.48347 7.04018 2.43605 7.57372 2.11097 8.05325C2.06577 8.11897 2.00579 8.20127 1.94026 8.2912C1.82644 8.4474 1.69585 8.62661 1.59679 8.78182C1.42197 9.05575 1.25116 9.38609 1.19245 9.77101C1.00088 11.0268 1.88398 11.8399 2.76346 12.2042C3.4182 12.4755 4.12567 12.6894 4.86357 12.8459C5.24629 14.1929 6.51269 15.1666 7.99947 15.1666C9.48615 15.1666 10.7525 14.1931 11.1353 12.8462C11.8737 12.6896 12.5816 12.4756 13.2368 12.2042C14.1162 11.8399 14.9994 11.0268 14.8078 9.77101C14.7491 9.3861 14.5783 9.05576 14.4034 8.78182C14.3044 8.62662 14.1738 8.44741 14.06 8.29121C13.9945 8.20131 13.9345 8.11901 13.8893 8.05331C13.5642 7.57375 13.5168 7.04027 13.5167 6.33333C13.5167 3.2942 11.0453 0.833328 8.00012 0.833328ZM3.48353 6.33333C3.48353 3.84961 5.50411 1.83333 8.00012 1.83333C10.4961 1.83333 12.5167 3.84965 12.5167 6.33337C12.5168 7.05499 12.5524 7.86444 13.0627 8.61613L13.0643 8.61847C13.1482 8.74056 13.2219 8.84064 13.2913 8.93497C13.3838 9.06063 13.4688 9.17611 13.5605 9.3198C13.7026 9.54255 13.7908 9.73558 13.8192 9.92181C13.9112 10.5247 13.5266 11.0017 12.8541 11.2804C10.0014 12.4621 5.99882 12.4621 3.14618 11.2804C2.47358 11.0017 2.08904 10.5247 2.18101 9.92181C2.20942 9.73558 2.29759 9.54255 2.43975 9.3198C2.53145 9.17611 2.61643 9.06065 2.70891 8.935C2.77824 8.8408 2.85215 8.74036 2.93592 8.61848L2.93752 8.61613C3.44788 7.86444 3.48347 7.05495 3.48353 6.33333ZM9.9754 13.0422C8.67637 13.2082 7.32244 13.2081 6.02345 13.0421C6.40445 13.7079 7.14181 14.1666 7.99947 14.1666C8.85706 14.1666 9.59436 13.708 9.9754 13.0422Z" fill="#616161" />
                            </svg>
                            <Typography variant="body2">Follow</Typography>
                          </>
                        )}
                      </Box>
                    </Box>

                    {/* Location & Time info */}
                    <Typography variant="body2" 
                      sx={{ 
                        color: '#616161',
                        fontSize: '14px',
                        mb: 1
                      }}
                    >
                      {alert.city || "Edinburgh"}
                    </Typography>

                    {/* Alert Content */}
                    <Typography variant="body2" sx={{ 
                      mb: 1.5, 
                      color: '#333',
                      flex: 1
                    }}>
                      {alert.description || ""}
                      {alert.recommendedAction && ` ${alert.recommendedAction}`}
                    </Typography>

                    {/* Alert Details */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {/* Start and End Time */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Start: {alert.expectedStart ? formatDateForDisplay(alert.expectedStart) : "06 May 9:00AM"}
                          </Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            End: {alert.expectedEnd ? formatDateForDisplay(alert.expectedEnd) : "06 May 9:00AM"}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Impact Level */}
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ 
                          display: 'inline-block',
                          px: 1.5, 
                          py: 0.5,
                          fontSize: '14px',
                          borderRadius: 1,
                          backgroundColor: alert.risk === 'Low' ? '#e6f4ea' : 
                            alert.risk === 'Medium' || !alert.risk ? '#fff4e5' : 
                            alert.risk === 'High' ? '#fdecea' : 'transparent',
                          color: alert.risk === 'Low' ? '#00855b' : 
                            alert.risk === 'Medium' || !alert.risk ? '#c17e00' : 
                            alert.risk === 'High' ? '#d32f2f' : 'inherit',
                          fontWeight: 500,
                        }}>
                          {alert.risk === 'Medium' || !alert.risk ? 'Moderated Impact' : `${alert.risk} Impact`}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>

>>>>>>> 2945eb6 (Initial commit)
            {hasMore && isAuthenticated && (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={handleLoadMore}
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                  sx={{
<<<<<<< HEAD
                    borderColor: 'black',
                    color: 'black',
                    borderRadius: 50,
                    px: 10,
                    py: 1
=======
                    borderColor: '#e0e0e0',
                    color: '#333',
                    borderRadius: 50,
                    px: 10,
                    py: 1,
                    '&:hover': {
                      borderColor: '#bdbdbd',
                      backgroundColor: 'rgba(0,0,0,0.02)'
                    }
>>>>>>> 2945eb6 (Initial commit)
                  }}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Container>
<<<<<<< HEAD
=======

      {/* Remaining components (FilterDrawer, Dialog, etc.) */}
>>>>>>> 2945eb6 (Initial commit)
      <FilterDrawer
        open={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        resultCount={totalCount}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        currentCity={city}
        isUsingCurrentLocation={!!coords && city !== 'Edinburgh'}
        onUseMyLocation={handleUseMyLocation}
        onResetLocation={handleResetLocation}
        locationLoading={locationLoading}
        locationAccuracy={locationAccuracy}
      />
<<<<<<< HEAD
=======
      
>>>>>>> 2945eb6 (Initial commit)
      <Dialog
        open={loginDialogOpen}
        onClose={handleCloseLoginDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxWidth: '380px',
            width: '100%'
          }
        }}
      >
        <DialogContent sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ mb: 2 }}>
            <Image
              src="/images/login-alert.png"
              alt="Login required"
              width={120}
              height={120}
              style={{ margin: '0 auto' }}
            />
          </Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 500, fontSize: '20px' }}>
            Login in to view updates of the alerts!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: '14px' }}>
            Please sign in to track disruptions and receive personalized notifications.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleLogin}
              sx={{
                bgcolor: 'black',
                color: 'white',
                '&:hover': { bgcolor: '#333' },
                py: 1.2,
                borderRadius: 2
              }}
            >
              Login Now
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleCloseLoginDialog}
              sx={{
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                py: 1.2,
                borderRadius: 2
              }}
            >
              Cancel
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
<<<<<<< HEAD
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Layout>
  );
} 
=======
    </Layout>
  );
}
>>>>>>> 2945eb6 (Initial commit)
