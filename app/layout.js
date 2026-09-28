import './globals.css';

export const metadata = {
  title: 'Counselling Portal',
  description: 'Mentor-Mentee Counselling Session Management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
