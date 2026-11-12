import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { CLINIC } from "@/lib/clinic";

export type EmailKind = "booked" | "rescheduled" | "cancelled";

type Props = {
  kind: EmailKind;
  audience: "patient" | "doctor";
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  reason: string;
  when: string;
  previousWhen?: string;
  manageUrl: string;
};

const headings: Record<EmailKind, string> = {
  booked: "Appointment confirmed",
  rescheduled: "Appointment rescheduled",
  cancelled: "Appointment cancelled",
};

export function emailSubject(kind: EmailKind, when: string, audience: Props["audience"], patientName: string) {
  const prefix = audience === "doctor" ? `${patientName}: ` : "";
  return `${prefix}${headings[kind]} — ${when}`;
}

export function AppointmentEmail(props: Props) {
  const { kind, audience, when, previousWhen } = props;
  const forPatient = audience === "patient";

  const intro = {
    booked: forPatient
      ? `Hi ${props.patientName}, your appointment with ${CLINIC.doctor} is booked.`
      : `${props.patientName} has booked an appointment.`,
    rescheduled: forPatient
      ? `Hi ${props.patientName}, your appointment with ${CLINIC.doctor} has been moved.`
      : `The appointment for ${props.patientName} has been moved.`,
    cancelled: forPatient
      ? `Hi ${props.patientName}, your appointment with ${CLINIC.doctor} has been cancelled.`
      : `The appointment for ${props.patientName} has been cancelled.`,
  }[kind];

  return (
    <Html lang="en">
      <Head />
      <Preview>{`${headings[kind]}: ${when}`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={brand}>{CLINIC.name}</Text>
          <Heading style={heading}>{headings[kind]}</Heading>
          <Text style={paragraph}>{intro}</Text>

          <Section style={card}>
            <Text style={label}>{kind === "cancelled" ? "Was" : "When"}</Text>
            <Text style={value}>{when}</Text>
            {kind === "rescheduled" && previousWhen ? (
              <>
                <Text style={label}>Previously</Text>
                <Text style={value}>{previousWhen}</Text>
              </>
            ) : null}
            <Text style={label}>Where</Text>
            <Text style={value}>
              {CLINIC.name}, {CLINIC.address}
            </Text>
            {!forPatient ? (
              <>
                <Text style={label}>Patient</Text>
                <Text style={value}>
                  {props.patientName} · {props.patientEmail} · {props.patientPhone}
                </Text>
                {props.reason ? (
                  <>
                    <Text style={label}>Reason for visit</Text>
                    <Text style={value}>{props.reason}</Text>
                  </>
                ) : null}
              </>
            ) : null}
          </Section>

          {forPatient && kind !== "cancelled" ? (
            <>
              <Button href={props.manageUrl} style={button}>
                Reschedule or cancel
              </Button>
              <Text style={small}>
                Need to change something? Use the button above, or call us on{" "}
                {CLINIC.phone}.
              </Text>
            </>
          ) : null}

          <Hr style={hr} />
          <Text style={small}>
            {CLINIC.name} · {CLINIC.address} · {CLINIC.phone}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f3f6f7",
  fontFamily: "Helvetica, Arial, sans-serif",
  margin: 0,
  padding: "24px 0",
};
const container = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  maxWidth: "520px",
  padding: "32px",
};
const brand = { color: "#0f6b70", fontSize: "13px", fontWeight: 700, margin: 0 };
const heading = { color: "#10201f", fontSize: "22px", margin: "8px 0 12px" };
const paragraph = { color: "#33413f", fontSize: "15px", lineHeight: "22px" };
const card = {
  backgroundColor: "#f3f6f7",
  borderRadius: "8px",
  margin: "16px 0",
  padding: "8px 16px",
};
const label = {
  color: "#5b6b69",
  fontSize: "12px",
  margin: "10px 0 0",
  textTransform: "uppercase" as const,
};
const value = { color: "#10201f", fontSize: "15px", margin: "2px 0 8px" };
const button = {
  backgroundColor: "#0f6b70",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "15px",
  padding: "12px 20px",
  textDecoration: "none",
};
const small = { color: "#5b6b69", fontSize: "13px", lineHeight: "20px" };
const hr = { borderColor: "#e3e9ea", margin: "24px 0 12px" };
