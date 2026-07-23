import { ShieldCheck } from "lucide-react";

/**
 * Public privacy policy — required by the Apple App Store / Google Play
 * listings for the "Gasan LGU" mobile app, and it also covers the portal.
 * PUBLIC route (no login) so store reviewers can always reach it.
 */
const EFFECTIVE = "July 23, 2026";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="mb-6">
    <h2 className="text-base font-semibold text-gray-900 mb-2">{title}</h2>
    <div className="space-y-2 text-sm text-gray-700 leading-relaxed">
      {children}
    </div>
  </section>
);

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white border rounded-lg shadow-sm p-6 md:p-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-blue-600 rounded-lg">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="text-xs text-gray-500">
              Gasan LGU mobile app &amp; Gasan Municipal Portal · Effective{" "}
              {EFFECTIVE}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-6">
          Municipality of Gasan, Province of Marinduque, Republic of the
          Philippines — Management Information System (MIS) Office
        </p>

        <Section title="1. Who we are">
          <p>
            The <strong>Gasan LGU</strong> mobile application and the{" "}
            <strong>Gasan Municipal Portal</strong> (www.lgu-portal.xyz) are
            official internal systems of the Municipal Government of Gasan,
            Marinduque. They are used by authorized municipal employees and
            health personnel to carry out government functions such as human
            resources, pharmacy and health services, document tracking, and
            related administrative work. The Municipality of Gasan is the
            controller of the personal data processed in these systems, in
            accordance with the Data Privacy Act of 2012 (RA 10173).
          </p>
        </Section>

        <Section title="2. What we collect">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Account information</strong> — username and password
              (passwords are stored only as one-way cryptographic hashes).
            </li>
            <li>
              <strong>Employee profile</strong> — name, birthday, sex, position,
              contact number and email (contact details are encrypted at rest),
              address, and an optional profile photo.
            </li>
            <li>
              <strong>Health-service records</strong> — for authorized health
              staff: patient registries, diagnoses, prescriptions and
              dispensing records handled by the Rural Health Unit, including an
              optional PhilHealth number. These are official RHU records
              accessible only to granted personnel.
            </li>
            <li>
              <strong>Photos and camera</strong> — the camera is used to scan
              medicine barcodes and documents and to take profile pictures.
              Images are captured only when you actively use those features.
            </li>
            <li>
              <strong>Location</strong> — only when you use a feature that
              attaches a location, and never in the background.
            </li>
            <li>
              <strong>Device/push token</strong> — to deliver work
              notifications you enable.
            </li>
          </ul>
        </Section>

        <Section title="3. What we use it for">
          <p>
            Data is processed solely to operate the municipality's internal
            services: signing you in, human-resources management, pharmacy
            inventory and dispensing, patient care records, document tracking,
            employee communication, and audit logging required for public
            accountability. We do <strong>not</strong> sell personal data, do{" "}
            <strong>not</strong> serve advertising, and do{" "}
            <strong>not</strong> use the data to track you across other apps or
            websites.
          </p>
        </Section>

        <Section title="4. Storage and security">
          <p>
            Records are stored on secured cloud infrastructure used by the
            municipality. Sensitive personal fields (such as contact details)
            are encrypted at rest; connections use HTTPS/TLS; access is
            restricted by per-user accounts, per-module permissions and
            per-storage grants, and actions are audit-logged. Data entered
            offline on the mobile app or desktop app is kept on the device and
            synchronized to the municipality's system when a connection is
            available.
          </p>
        </Section>

        <Section title="5. Sharing">
          <p>
            Data is shared only among authorized municipal personnel who need
            it for their official functions, with government agencies when a
            law requires it, and with our infrastructure providers strictly as
            processors for hosting. No third party receives personal data for
            marketing or analytics.
          </p>
        </Section>

        <Section title="6. Retention">
          <p>
            Records are retained for as long as required by government
            record-keeping rules and the National Archives of the Philippines
            regulations, after which they are disposed of securely.
          </p>
        </Section>

        <Section title="7. Your rights">
          <p>
            Under the Data Privacy Act you may ask to access or correct your
            personal data, or object to processing that is not required by law,
            by contacting the MIS Office. Account deletion requests from
            separated employees are handled through the Human Resources office;
            official government records associated with your work are retained
            per record-keeping rules.
          </p>
        </Section>

        <Section title="8. Children">
          <p>
            The app is for municipal personnel and is not directed at children.
            Patient records of minors are handled by authorized health staff as
            official RHU records.
          </p>
        </Section>

        <Section title="9. Changes and contact">
          <p>
            We will update this page when the policy changes. Questions and
            requests: <strong>MIS Office, Municipality of Gasan</strong>,
            Marinduque — email{" "}
            <a
              href="mailto:hr@gasan.gov.ph"
              className="text-blue-600 underline"
            >
              hr@gasan.gov.ph
            </a>
            .
          </p>
        </Section>

        <p className="text-[11px] text-gray-400 border-t pt-4">
          © {new Date().getFullYear()} Municipal Government of Gasan,
          Marinduque. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
