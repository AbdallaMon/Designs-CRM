// app/privacy/page.js
import React from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Link,
} from "@mui/material";

export const metadata = {
  title: "Privacy Policy | DreamStudiio",
  description: "DreamStudiio Privacy Policy",
};

function Section({ title, children }) {
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export default function PrivacyPage() {
  const effectiveDate = "December 14, 2025";
  const supportEmail = "support@dreamstudiio.com";
  const website = "dreamstudiio.com";

  return (
    <Box sx={{ py: { xs: 4, md: 7 }, bgcolor: "background.default" }}>
      <Container maxWidth="md">
        <Paper elevation={1} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Privacy Policy
          </Typography>

          <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
            Effective date: {effectiveDate}
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body1" sx={{ lineHeight: 1.9 }}>
            DreamStudiio (“we”, “us”, “our”) respects your privacy. This Privacy
            Policy explains what information we collect, how we use it, and your
            choices when you use our website and services (the “Service”).
          </Typography>

          <Section title="1) Information We Collect">
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 1 }}>
              A) Account & Contact Information
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.9 }}>
              When you sign in or create an account, we may collect: name, email
              address, and profile picture (if provided by your sign-in
              provider).
            </Typography>

            <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 2 }}>
              B) Google Account Data (If you connect Google)
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.9 }}>
              If you connect your Google account, we request access only to the
              permissions you approve. Depending on features you enable, we may
              access Google Calendar data needed to create, update, or delete
              calendar events.
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.9, mt: 1 }}>
              We do not sell your Google data, and we do not use it for
              advertising.
            </Typography>

            <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 2 }}>
              C) Usage & Technical Data
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.9 }}>
              We may collect basic technical data for security and analytics
              such as IP address, device/browser information, and log data
              (timestamps, pages/actions).
            </Typography>
          </Section>

          <Section title="2) How We Use Information">
            <List dense sx={{ pl: 1 }}>
              {[
                "Provide and operate the Service",
                "Authenticate users and keep accounts secure",
                "Create/update/delete calendar events if you enable calendar sync",
                "Improve performance and reliability",
                "Prevent fraud, abuse, and unauthorized access",
                "Comply with legal obligations",
              ].map((item) => (
                <ListItem key={item} sx={{ py: 0.25 }}>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Section>

          <Section title="3) Google API Data Use & Limited Use">
            <Typography variant="body1" sx={{ lineHeight: 1.9 }}>
              If our Service accesses Google user data, we only use that data to
              provide the features you request. We do not use Google data to
              build advertising profiles, we do not sell Google data to third
              parties, and we do not allow humans to read your Google data
              unless you explicitly request support and consent, or it is
              required for security, legal compliance, or to maintain the
              Service.
            </Typography>
          </Section>

          <Section title="4) Sharing of Information">
            <Typography variant="body1" sx={{ lineHeight: 1.9 }}>
              We may share information only with service providers (hosting,
              logging/monitoring) as needed to run the Service, for legal
              compliance, or to protect the Service and users. We do not sell
              personal data.
            </Typography>
          </Section>

          <Section title="5) Data Retention">
            <Typography variant="body1" sx={{ lineHeight: 1.9 }}>
              We retain personal data only as long as needed to provide the
              Service, meet legal requirements, resolve disputes, and enforce
              agreements. You can request deletion of your account and
              associated data by contacting us.
            </Typography>
          </Section>

          <Section title="6) Security">
            <Typography variant="body1" sx={{ lineHeight: 1.9 }}>
              We use reasonable technical and organizational measures to protect
              your data, including access controls and encryption where
              appropriate. No method of transmission or storage is 100% secure.
            </Typography>
          </Section>

          <Section title="7) Your Choices & Rights">
            <List dense sx={{ pl: 1 }}>
              {[
                "Disconnect your Google account at any time (from within the Service if available, or from your Google Account permissions page).",
                "Request access, correction, or deletion of your data by contacting us.",
              ].map((item) => (
                <ListItem key={item} sx={{ py: 0.25 }}>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Section>

          <Section title="8) Children’s Privacy">
            <Typography variant="body1" sx={{ lineHeight: 1.9 }}>
              Our Service is not intended for children under 13, and we do not
              knowingly collect personal information from children.
            </Typography>
          </Section>

          <Section title="9) International Transfers">
            <Typography variant="body1" sx={{ lineHeight: 1.9 }}>
              Your data may be processed in countries where our service
              providers operate. We take steps to ensure appropriate safeguards
              are in place.
            </Typography>
          </Section>

          <Section title="10) Changes to This Policy">
            <Typography variant="body1" sx={{ lineHeight: 1.9 }}>
              We may update this Privacy Policy from time to time. We will
              update the “Effective date” above and may notify you within the
              Service.
            </Typography>
          </Section>

          <Section title="11) Contact Us">
            <Typography variant="body1" sx={{ lineHeight: 1.9 }}>
              DreamStudiio
              <br />
            </Typography>
          </Section>
        </Paper>
      </Container>
    </Box>
  );
}
