'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  SelectChangeEvent,
} from '@mui/material';
import { useToast } from '@/ui/toast';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';

interface ShareForecastModalProps {
  open: boolean;
  onClose: () => void;
  forecastTitle?: string;
}

const ShareForecastModal: React.FC<ShareForecastModalProps> = ({
  open,
  onClose,
}) => {
  const [forwardTo, setForwardTo] = useState<string>('Guests');
  const [notes, setNotes] = useState<string>('');
  const [sendVia, setSendVia] = useState<string>('Email');
  const { showToast } = useToast();

  const handleSubmit = () => {
    showToast('This feature will be implemented soon!', 'success');
    onClose();
  };

  const handleForwardToChange = (event: SelectChangeEvent<string>) => {
    setForwardTo(event.target.value);
  };

  const handleSendViaChange = (event: SelectChangeEvent<string>) => {
    setSendVia(event.target.value);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 0,
          maxWidth: 480
        }
      }}
    >
      <Box sx={{ position: 'relative', pt: 3, pb: 2, px: 3 }}>
        <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          Want to forward?
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        
        {/* Paper airplane icon */}
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <Box
            sx={{
              width: 150,
              height: 150,
              borderRadius: '50%',
              backgroundColor: '#fff',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: '1px solid #eee',
            }}
          >
            <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.1946 85.0487C19.2454 83.5091 26.2923 81.9516 33.3363 80.3805C34.7896 82.0508 50.6753 96.0215 57.3876 102.447C57.8113 102.853 58.3602 102.66 58.6173 102.288C61.9613 102.533 63.4555 102.589 66.7798 103.47C89.9957 85.9338 89.8595 86.5346 94.7962 83.7193C95.5368 84.4388 96.2717 85.1641 97.0201 85.8753C97.2641 86.107 97.6933 86.2005 97.9897 86.0003C113.725 75.3702 144.38 57.3748 148.552 53.7268C148.879 53.4409 148.865 53.0766 148.683 52.7995C148.665 52.7422 148.641 52.6841 148.607 52.6255C147.053 49.9039 145.723 47.0698 144.096 44.3873C143.838 43.962 143.383 43.9323 143.04 44.1128C131.412 43.7597 119.783 43.4524 108.15 43.3323C112.513 30.7032 105.389 17.5843 93.7548 13.388C84.404 10.0156 73.6222 13.0578 67.3613 20.7526C61.2207 28.3 60.3397 39.1438 65.1868 47.5646C61.1941 48.6263 57.2014 49.6875 53.2087 50.7495C53.1779 50.7578 53.1524 50.7706 53.124 50.7813C52.8727 50.7732 52.6194 50.8826 52.4514 51.1625C50.1451 55.0097 48.048 58.9688 46.0488 62.9828C45.8717 63.3383 45.9709 63.6763 46.1839 63.9055C46.8003 65.3912 47.6058 66.775 48.3253 68.2063C41.1917 69.7409 34.055 71.2607 26.911 72.7443C26.7462 72.7123 26.5634 72.7425 26.3769 72.8716C21.3764 76.3378 16.6347 80.1597 11.5501 83.5065C10.8125 83.992 11.2914 85.2455 12.1946 85.0487ZM27.0647 74.3375C33.4753 73.4669 97.723 58.3815 142.781 50.4711C142.221 51.187 141.708 51.9393 141.275 52.7159C98.8365 63.8776 58.2443 73.3219 15.6006 82.6638C19.4558 79.936 23.1852 77.0334 27.0647 74.3375ZM47.7613 63.5547C56.8238 61.0542 65.96 58.8472 75.16 56.9141C77.5748 58.118 80.1881 58.9169 82.8821 59.2597C75.7674 60.6758 55.3072 64.747 49.0878 66.2222C48.6162 65.3477 48.1483 64.4716 47.7613 63.5547ZM103.045 51.8969C116.558 49.8435 130.134 48.2594 143.741 46.9768C144.033 47.5018 144.319 48.0302 144.601 48.5604C129.14 50.8094 112.705 53.5805 97.3045 56.4633C99.4589 55.2456 101.389 53.6972 103.045 51.8969ZM145.326 49.9209C145.647 50.5315 145.972 51.1404 146.299 51.7482C145.677 51.4919 145.061 51.2227 144.449 50.9354C144.882 50.4157 145.249 50.0449 145.326 49.9209ZM35.9923 80.6987C40.1841 81.6832 50.7048 83.9821 50.9946 84.0597C53.6752 84.8011 52.6609 84.0636 83.6647 73.338C86.2891 76.8159 89.7165 80.6563 91.6722 83.6464C80.6811 89.8347 69.4496 95.5917 57.9506 100.779C50.7639 93.9414 43.2089 87.5042 35.9923 80.6987ZM97.6826 84.2893C93.6665 80.4534 89.7704 76.4948 85.8167 72.5951C96.728 68.8373 112.631 63.4828 136.961 55.4914C138.607 55.0617 140.255 54.6399 141.9 54.2071C142.188 54.193 142.411 53.9966 142.511 53.774C142.79 53.2469 143.118 52.7341 143.467 52.2339C144.406 52.6836 145.358 53.0883 146.32 53.4755C142.811 56.0966 99.9833 82.7606 97.6826 84.2893ZM140.917 45.6508C128.769 46.8344 116.648 48.2706 104.575 50.0654C105.763 48.4857 106.76 46.7578 107.54 44.924C118.668 45.0323 129.793 45.3185 140.917 45.6508ZM66.6488 24.5677C71.3337 16.5695 80.7905 12.2518 89.9056 13.9904C105.991 17.059 114.116 37.0916 102.167 50.5354C102.136 50.5633 102.109 50.5932 102.085 50.6258C93.0072 60.729 77.2911 59.9209 68.9355 50.1242C62.891 43.037 61.9342 32.6167 66.6488 24.5677ZM53.6472 52.2888C57.7891 51.1873 61.9311 50.0865 66.073 48.9849C67.9321 51.7336 70.3274 54.0138 73.06 55.7357C64.8152 57.4992 56.6217 59.4826 48.4878 61.7029C50.1144 58.5141 51.8147 55.3662 53.6472 52.2888Z" fill="black"/>
<path d="M73.5917 46.2395C67.2018 36.9772 71.9872 24.3569 82.6325 21.7129C82.7427 22.8981 82.9487 24.0736 83.2437 25.2051C83.3852 25.7481 83.9083 25.8671 84.313 25.7028C84.6507 25.7281 84.6173 25.7267 88.67 22.6413C89.4768 22.027 90.8013 21.4246 91.2906 20.5187C91.5549 20.0298 91.3008 19.5306 90.8125 19.3434C83.4366 16.5141 83.7884 16.6371 83.701 16.6226C83.1909 16.5304 82.844 16.8244 82.745 17.1871C82.745 17.1869 82.7448 17.1866 82.7445 17.1861C82.6979 17.6284 82.5234 18.5437 82.5435 20.1249C70.8172 22.9575 65.0659 36.691 72.2102 47.047C72.7911 47.8892 74.1784 47.09 73.5917 46.2395Z" fill="black"/>
<path d="M88.3538 49.976C88.1782 48.8143 87.9092 47.6687 87.5631 46.5841C87.3647 45.9619 86.6681 45.9067 86.2676 46.2013C86.1342 46.2229 86.0006 46.2747 85.8751 46.3742C84.6717 47.3283 83.5116 48.3328 82.3428 49.3283C81.5889 49.9705 80.21 50.7244 79.7879 51.6174C79.5618 52.0955 79.7433 52.6236 80.266 52.7927C82.6811 53.5729 85.0983 54.3471 87.5134 55.1273C87.5142 55.1218 87.515 55.1166 87.5157 55.1114C88.1708 55.3102 88.5256 54.8738 88.4887 54.3427C88.4918 54.3458 88.4952 54.3492 88.4983 54.3523C88.591 53.4492 88.5954 52.5229 88.5335 51.5947C100.117 48.2158 105.032 34.0354 97.4165 24.1757C96.7962 23.3726 95.4056 24.1682 96.035 24.9833C102.987 33.983 98.8017 46.6807 88.3538 49.976Z" fill="black"/>
<path d="M35.6814 101.616C37.4592 99.7488 39.2371 97.8824 41.0152 96.0158C41.7251 95.2702 40.5957 94.1371 39.8837 94.8845C38.1059 96.7509 36.3277 98.6176 34.5499 100.484C33.8397 101.23 34.9694 102.363 35.6814 101.616Z" fill="black"/>
<path d="M29.034 109.684C27.8684 111.569 27.0678 113.619 26.6595 115.797C26.471 116.804 28.0126 117.235 28.2025 116.223C28.5876 114.166 29.3145 112.272 30.4158 110.492C30.9587 109.614 29.5754 108.809 29.034 109.684Z" fill="black"/>
<path d="M25.7428 124.801C25.6608 126.224 25.5787 127.647 25.4967 129.069C25.4376 130.098 27.0379 130.095 27.0967 129.069C27.1787 127.647 27.2608 126.224 27.3428 124.801C27.4019 123.773 25.8017 123.776 25.7428 124.801Z" fill="black"/>
<path d="M28.9969 136.275C28.3157 135.5 27.1876 136.635 27.8654 137.406C29.1964 138.919 30.5272 140.433 31.8579 141.946C32.5391 142.721 33.6673 141.586 32.9894 140.815C31.6584 139.301 30.3277 137.788 28.9969 136.275Z" fill="black"/>
<path d="M49.4848 146.643C50.4775 146.374 50.0561 144.83 49.0595 145.1C47.2777 145.583 45.4796 145.446 43.8092 144.648C42.8848 144.206 42.072 145.585 43.0017 146.029C45.0663 147.016 47.271 147.243 49.4848 146.643Z" fill="black"/>
<path d="M64.3157 140.924C66.7058 139.31 69.0962 137.695 71.4863 136.08C72.335 135.507 71.5352 134.12 70.6787 134.699C68.2886 136.313 65.8985 137.928 63.5082 139.542C62.6595 140.116 63.4595 141.503 64.3157 140.924Z" fill="black"/>
<path d="M85.2926 130.161C87.0619 128.393 89.1856 127.225 91.6207 126.66C92.6233 126.427 92.1991 124.884 91.1955 125.117C88.5064 125.741 86.1132 127.079 84.1614 129.029C83.4319 129.758 84.5632 130.89 85.2926 130.161Z" fill="black"/>
<path d="M105.746 121.565C108.008 120.679 110.318 120.34 112.738 120.543C113.764 120.629 113.758 119.028 112.738 118.943C110.185 118.729 107.706 119.088 105.321 120.022C104.373 120.394 104.785 121.942 105.746 121.565Z" fill="black"/>
<path d="M130.688 125.489C131.154 126.407 132.535 125.598 132.069 124.681C130.801 122.178 128.327 120.612 125.543 120.425C124.515 120.356 124.519 121.956 125.543 122.025C127.782 122.175 129.681 123.501 130.688 125.489Z" fill="black"/>
<path d="M139.377 136.859C138.912 134.865 138.08 133.006 136.896 131.335C136.305 130.501 134.917 131.3 135.514 132.142C136.628 133.714 137.396 135.408 137.834 137.284C138.067 138.287 139.61 137.863 139.377 136.859Z" fill="black"/>
<path d="M141.786 147.206C141.693 145.784 141.6 144.362 141.506 142.94C141.44 141.918 139.839 141.911 139.906 142.94C140 144.362 140.093 145.784 140.186 147.206C140.253 148.228 141.853 148.236 141.786 147.206Z" fill="black"/>
</svg>

          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 1 }}>
          This content will be sent to the destination using the method you selected.
        </Typography>
      </Box>

      <DialogContent sx={{ pt: 1, pb: 1, px: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Forward To */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
              Forward To
            </Typography>
            <FormControl fullWidth>
              <Select
                value={forwardTo}
                onChange={handleForwardToChange}
                sx={{ 
                  borderRadius: 1.5,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      borderRadius: 2,
                      boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.1)',
                    },
                  },
                }}
              >
                <MenuItem value="Guests">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span>Guests</span>
                    <CheckIcon sx={{ color: '#22c55e', fontSize: 18 }} />
                  </Box>
                </MenuItem>
                <MenuItem value="Team">Team</MenuItem>
                <MenuItem value="Management">Management</MenuItem>
                <MenuItem value="Email">Email</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Add Notes */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
              Add Notes
            </Typography>
            <TextField
              fullWidth
              placeholder="Add notes for your team or guests (Optional but recommended)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={3}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 1.5,
                  fontSize: '0.9rem'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                }
              }}
            />
          </Box>

          {/* Send Via */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
              Send Via
            </Typography>
            <FormControl fullWidth>
              <Select
                value={sendVia}
                onChange={handleSendViaChange}
                sx={{ 
                  borderRadius: 1.5,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      borderRadius: 2,
                      boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.1)',
                    },
                  },
                }}
              >
                <MenuItem value="Email">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span>Email</span>
                    <CheckIcon sx={{ color: '#22c55e', fontSize: 18 }} />
                  </Box>
                </MenuItem>
                <MenuItem value="SMS">SMS</MenuItem>
                <MenuItem value="Internal Messaging">Internal Messaging</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Action buttons */}
          <Box sx={{ mt: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmit}
              sx={{
                py: 1.5,
                backgroundColor: '#000',
                color: '#fff',
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 'medium',
                mb: 1.5,
                '&:hover': {
                  backgroundColor: '#333',
                },
              }}
            >
              Send Forward
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={onClose}
              sx={{
                color: '#666',
                textTransform: 'none',
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ShareForecastModal; 