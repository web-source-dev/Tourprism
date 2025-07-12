'use client';

import { Box, Link, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

interface GetAccessCardProps {
  onClick?: () => void;
}

const GetAccessCard: React.FC<GetAccessCardProps> = ({ onClick }) => {
  const router = useRouter();


  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push('/login');
    }
  };



  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, width: '100%', bgcolor:'secondary.main', p:2, borderRadius:2 }}>
      <Typography variant="body1" color="white">See what else is disrupting your
      business this week.<Link href="/login" color="white" sx={{textDecoration:'underline'}} onClick={handleClick}>
      Create Free Account

      </Link>
      </Typography>
    </Box>
  );
};

export default GetAccessCard; 