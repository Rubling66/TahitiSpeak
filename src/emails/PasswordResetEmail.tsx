import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface PasswordResetEmailProps {
  userName?: string;
  resetUrl?: string;
  expirationTime?: string;
  supportUrl?: string;
}

export const PasswordResetEmail = ({
  userName = 'Tahitian Learner',
  resetUrl = 'https://tahitispeak.com/reset-password',
  expirationTime = '1 hour',
  supportUrl = 'https://tahitispeak.com/support',
}: PasswordResetEmailProps) => {
  const previewText = `Reset your TahitiSpeak password - expires in ${expirationTime}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src="https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=TahitiSpeak%20security%20lock%20icon%20with%20Tahitian%20blue%20ocean%20colors&image_size=square"
              width="80"
              height="80"
              alt="TahitiSpeak Security"
              style={logo}
            />
          </Section>

          <Section style={heroSection}>
            <Heading style={h1}>Password Reset Request</Heading>
            <Text style={heroText}>
              Hi {userName}, we received a request to reset your TahitiSpeak password.
            </Text>
          </Section>

          <Section style={contentSection}>
            <Text style={bodyText}>
              If you requested this password reset, click the button below to create a new password. 
              This link will expire in {expirationTime}.
            </Text>
          </Section>

          <Section style={ctaSection}>
            <Button style={button} href={resetUrl}>
              Reset Password
            </Button>
          </Section>

          <Section style={securitySection}>
            <Heading style={h2}>Security Information</Heading>
            <Text style={securityText}>
              🔒 This link expires in {expirationTime} for your security
            </Text>
            <Text style={securityText}>
              🔒 Only use this link if you requested the password reset
            </Text>
            <Text style={securityText}>
              🔒 Never share this link with anyone else
            </Text>
          </Section>

          <Section style={warningSection}>
            <Text style={warningText}>
              <strong>Didn't request this reset?</strong>
            </Text>
            <Text style={warningDescription}>
              If you didn't request a password reset, you can safely ignore this email. 
              Your password will remain unchanged, and no action is required.
            </Text>
          </Section>

          <Section style={supportSection}>
            <Text style={supportText}>
              Need help? Our support team is here to assist you.
            </Text>
            <Link href={supportUrl} style={supportLink}>
              Contact Support
            </Link>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This password reset was requested from your TahitiSpeak account.
            </Text>
            <Text style={footerText}>
              The TahitiSpeak Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PasswordResetEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const logoContainer = {
  padding: '20px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
  borderRadius: '50%',
};

const heroSection = {
  padding: '24px 20px',
  textAlign: 'center' as const,
  backgroundColor: '#dc2626',
  color: '#ffffff',
  borderRadius: '8px',
  margin: '0 20px 24px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 12px',
  textAlign: 'center' as const,
};

const heroText = {
  color: '#ffffff',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0',
};

const contentSection = {
  padding: '0 20px 24px',
};

const h2 = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const bodyText = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
};

const ctaSection = {
  padding: '24px 20px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  border: 'none',
  cursor: 'pointer',
};

const securitySection = {
  padding: '0 20px 24px',
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  margin: '0 20px 24px',
  padding: '20px',
};

const securityText = {
  color: '#1e40af',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 8px',
};

const warningSection = {
  padding: '0 20px 24px',
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  margin: '0 20px 24px',
  padding: '20px',
  border: '1px solid #fecaca',
};

const warningText = {
  color: '#dc2626',
  fontSize: '16px',
  margin: '0 0 8px',
};

const warningDescription = {
  color: '#991b1b',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
};

const supportSection = {
  padding: '0 20px 24px',
  textAlign: 'center' as const,
};

const supportText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 12px',
};

const supportLink = {
  color: '#0ea5e9',
  fontSize: '14px',
  textDecoration: 'underline',
};

const footer = {
  padding: '0 20px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e2e8f0',
  paddingTop: '24px',
};

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '1.4',
  margin: '0 0 8px',
};