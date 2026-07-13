(security-documentation)=

# Security Documentation

:::{admonition} Scope
:class: tip

This page documents Orion Intelligence security controls, operational safeguards, and SOC 2 Security readiness notes for the platform documentation set.
:::

```{contents}
:local:
:depth: 2
```

## 3.1 Security Overview

### Overview

Security is a core part of the Orion Intelligence platform. Orion is designed to support cyber intelligence, threat intelligence, OSINT investigations, data breach analysis, compromise monitoring, network intelligence, and related investigative workflows.

Because the platform may process sensitive intelligence data, tenant-specific information, investigation records, user activity, and system configuration data, security controls are applied across the application, infrastructure, database, and operational layers.

Orion uses a layered security approach to protect platform access, user accounts, tenant data, backend services, databases, and operational workflows. These security layers work together to reduce unauthorized access, protect sensitive information, maintain operational visibility, and support reliable platform operations.

### Security Purpose

The purpose of Orion's security design is to protect the platform, its users, and the data processed within the system.

The security approach is designed to:

Prevent unauthorized access to the platform.

Protect user accounts and authenticated sessions.

Restrict access to features and modules based on roles, licenses, and permissions.

Protect tenant-specific information.

Secure communication between users, frontend services, backend APIs, and supporting systems.

Protect sensitive data during storage and transmission.

Maintain logs and audit records for operational visibility.

Support recovery from system failure, data corruption, or infrastructure disruption.

Support secure and reliable platform operations.

### Security Objectives

Orion Intelligence security controls are designed around the following objectives:

### Security Layers

Orion applies security across multiple layers of the platform:

Authentication

Authorization

Role-Based Access Control

Tenant Isolation

API Security

Encryption

Database Security

Logging and Audit Records

Monitoring

Backup and Recovery

Network Security

Secrets Management

Patch Management

Vulnerability Management

Disaster Recovery

Each security layer is documented separately in the Security Documentation section.

### Security Responsibilities

Security within Orion Intelligence is shared across multiple roles.

Genesis Technologies is responsible for designing, maintaining, and improving the security controls that support the Orion platform.

Administrators are responsible for managing users, reviewing platform activity, maintaining configuration settings, and supporting operational security activities.

Developers are responsible for maintaining secure application code, reviewing changes, fixing vulnerabilities, and following secure development practices.

Infrastructure and Operations Personnel are responsible for managing the hosting environment, firewall rules, SSL certificates, backups, deployments, monitoring, and system-level maintenance.

Authorized Users are responsible for using the platform according to assigned permissions, protecting their credentials, and reporting suspicious activity or security issues when identified.

### Security Summary

Orion Intelligence follows a layered security model that protects the platform across user access, application logic, backend APIs, databases, infrastructure, and operational processes.

The platform combines authentication, authorization, role-based access control, tenant isolation, encryption, logging, monitoring, backup, and network-level protections to support secure platform access, protected data handling, reliable intelligence workflows, and resilient system operations.

## 3.2 Authentication Security

### Overview

Orion Intelligence uses a token-based authentication model to verify user identity and control access to protected platform resources. Authentication is required before users can access dashboards, intelligence modules, search features, reports, administrative pages, and backend API routes.

The authentication flow includes user registration, password hashing, login verification, two-factor authentication, session creation, access token generation, token validation, token refresh, password reset, logout, and single active session handling.

### User Registration

During registration, a user provides the required account information, including email address, username, and password.

After the registration request is submitted, the backend validates the provided information and checks whether the email address or username already exists. If the submitted information is valid, the backend creates a new user account.

User passwords are not stored in plain text. Before saving the user record, the backend hashes the password and stores only the hashed password value in the database.

This helps protect user credentials and prevents direct exposure of passwords from stored database records.

### Password Storage

Orion does not store user passwords in plain text. Passwords are hashed before they are saved in the database.

During login, the submitted password is compared against the stored password hash. If the password matches the stored hash, the user is allowed to continue through the authentication process.

### Login Verification

During login, the user provides their username or email address and password. The frontend sends the login request to the backend for verification.

The backend retrieves the user account and compares the submitted password with the stored password hash. If the password is valid, the user proceeds to the next authentication step.

If the credentials are invalid, access is denied and the user is not allowed to continue into the platform.

### Two-Factor Authentication

Orion Intelligence supports two-factor authentication using an authenticator application.

After the user enters valid login credentials, the platform requires an additional one-time password generated by the user's authenticator app. The user must enter this OTP before access is granted.

This adds an additional layer of protection because access requires both:

The user's password

The OTP generated by the authenticator application

If the OTP is valid, the backend completes the authentication process and creates the user session. If the OTP is invalid or expired, access is denied.

### Two-Factor Authentication Flow

```text
User enters username/email and password
        |
        v
Backend verifies credentials
        |
        v
Platform requests OTP from authenticator app
        |
        v
User enters OTP
        |
        v
Backend verifies OTP
        |
        v
If OTP is valid, session is created
        |
        v
If OTP is invalid, access is denied

```

### Session Creation

After successful login and two-factor authentication, the backend creates a new session ID for the authenticated user. The session ID is used to track the user's active session and verify that future requests are associated with a valid login.

Each successful login creates a fresh session. If the same user logs in from another browser, device, or location, the backend expires the previous session and keeps only the latest session active.

This ensures that only one active session is maintained for a user account at a time.

### Access Token Generation

After the session is created, the backend generates an access token and returns it to the frontend.

The frontend stores the access token and includes it with future requests to protected backend APIs. The access token is used by the backend to verify that the request is coming from an authenticated user.

### Token Validation

When a user performs an action inside Orion, the frontend sends the access token with the request. The backend receives the request, decodes the token, verifies its validity, and checks the associated session.

If the token is valid and the session is active, the backend allows the request to continue.

If the token is expired, invalid, malformed, or not linked to an active session, the backend rejects the request and the user is logged out.

### Token Refresh

Access tokens are valid for a limited period of time. To maintain an authenticated session, the frontend may request a refreshed token after a defined interval.

When a token refresh request is received, the backend verifies the existing token and session information. If the session is valid, the backend issues a new access token and returns it to the frontend.

If the token or session cannot be verified, the backend does not issue a new token and the user is logged out.

### Forgot Password and Password Reset

Orion Intelligence provides a forgot password option for users who are unable to access their accounts.

When a user selects the forgot password option, the user enters their registered email address. The platform sends a password reset link to the user's email address.

The user can open the reset link and create a new password. After the new password is submitted, the backend validates the reset request and updates the stored password hash.

The new password is not stored in plain text. It is hashed before being saved in the database.

### Password Reset Flow

```text
User selects forgot password
        |
        v
User enters registered email address
        |
        v
Platform sends password reset link to email
        |
        v
User opens reset link
        |
        v
User enters new password
        |
        v
Backend validates reset request
        |
        v
Backend hashes the new password
        |
        v
Updated password hash is saved

```

### Single Active Session Handling

Orion Intelligence supports single active session handling for user accounts.

If the same user logs in from a second browser, device, or location, the backend creates a new session for the latest login and expires the previous session.

Any further request from the older session will fail token or session validation, and the previous user session will be logged out.

This helps reduce the risk of stale sessions, shared sessions, or unauthorized continued access from older login locations.

### Logout

When a user logs out, the frontend sends a logout request to the backend. The backend invalidates the active session and prevents the associated token from being used for future requests.

After logout, the frontend removes the stored token and redirects the user to the login page.

### Protected Routes

Protected routes require a valid access token and active session before access is granted.

Protected resources may include:

Dashboards

Intelligence modules

Search APIs

Reports

User profile routes

Administrative routes

Audit logs

System configuration pages

If authentication fails, the backend blocks access and requires the user to log in again.

### Authentication Flow

```text
User enters login credentials
        |
        v
Backend verifies username/email and password
        |
        v
User enters OTP from authenticator app
        |
        v
Backend verifies OTP
        |
        v
Backend creates a new session ID
        |
        v
Backend generates an access token
        |
        v
Token is returned to frontend
        |
        v
Frontend sends token with protected API requests
        |
        v
Backend validates token and session
        |
        v
Request is allowed or rejected

```

### Authentication Security Summary

Orion Intelligence uses backend-controlled authentication to verify users before allowing access to protected platform resources. Passwords are stored as hashes, users authenticate using their credentials and an OTP from an authenticator app, sessions are created after successful authentication, and access tokens are validated on protected requests.

The platform also supports password reset through email-based reset links and single active session handling, where a new login expires the previous session for the same user. This authentication model helps protect user accounts, platform access, and sensitive intelligence workflows.

## 3.3 Authorization and Role-Based Access Control

### Overview

Orion Intelligence uses authorization and Role-Based Access Control (RBAC) to control what authenticated users are allowed to access within the platform. After a user successfully logs in, Orion determines the user's permitted actions based on their assigned role, tenant association, and license plan.

Authorization is enforced at both the frontend and backend levels. The frontend displays only the modules and options available to the user's role and license, while the backend validates access before allowing requests to protected modules and APIs.

This ensures that users can only access the features, data, and administrative functions that they are authorized to use.

### Authorization Model

The Orion authorization model is based on three main factors:

User Role

Tenant or Company Association

Assigned License Plan

A user must have the correct role and license permissions before accessing specific modules, features, or administrative functions.

For example, a user may belong to a tenant but may only see the modules that are included in that tenant's assigned license. Similarly, an analyst may be allowed to perform investigation and analysis tasks but may not be allowed to access account creation, user management, or tenant administration functions.

### User Roles

Orion Intelligence supports the following primary user roles:

### Admin Role

The Admin role is used for platform-level administration. Admin users have elevated access to manage and oversee the Orion platform.

Admin users may be responsible for:

Managing platform-level configuration

Managing tenants or companies

Managing users

Assigning or reviewing license access

Reviewing system activity

Accessing administrative dashboards

Supporting operational and security management activities

Admin access is intended to be limited to authorized personnel responsible for managing the Orion platform.

### Maintainer Role

The Maintainer role acts as the administrator for a specific tenant or company. A maintainer manages tenant-level operations and users within their assigned tenant.

Maintainer users may be responsible for:

Managing tenant users

Managing tenant-level settings

Reviewing tenant activity

Supporting tenant operations

Managing tenant-specific workflows

Accessing maintainer features where enabled

A maintainer has more privileges than a standard member or analyst but is limited to the tenant or company they are assigned to.

### Member Role

The Member role is assigned to users who are part of a company or tenant. Members can access platform modules and features according to the permissions granted by their role and the license assigned to the tenant.

Members may have access to standard platform functionality, investigation tools, and available modules depending on the tenant's license plan.

Members may have broader visibility than analysts, including access to company or tenant-related areas where permitted.

### Analyst Role

The Analyst role is designed for users who are hired or assigned specifically to perform analysis activities within Orion.

Analysts can access investigation and analysis features that are permitted by their assigned role and license. However, analysts do not have access to administrative functions such as account creation, tenant management, or user management.

The Analyst role is intended for users who need to review, investigate, and analyze intelligence data without managing platform or tenant administration.

### License-Based Access Control

In addition to user roles, Orion uses license-based access control to determine which modules and capabilities are available to a user or tenant.

Each license plan defines the modules and features that are enabled for that account. If a module is not included in the assigned license, the user cannot access that module.

License-based access helps ensure that platform capabilities are delivered according to the customer's selected plan and operational requirements.

### License Plans

Orion Intelligence supports the following license plans:

### Module-Level Access

Module-level access is controlled using a combination of license permissions and user role permissions.

The frontend only displays the modules that are available to the user's role and license. This helps keep the user interface clean and prevents users from seeing features they are not allowed to use.

The backend also checks license and permission rules before allowing access to protected modules or APIs. This means that even if a restricted API endpoint is called directly, the backend validates the user's access before processing the request.

### Frontend Access Control

The frontend applies access control by showing or hiding modules based on the user's assigned role and license.

For example:

A Free user only sees General Intelligence.

An OSINT Basic user sees the modules included in the OSINT Basic license.

An OSINT Advanced user sees additional advanced features such as Stealer Logs, CTI Graph, Mapping, and Geo Fencing.

A Pentester user sees scanning-related functionality.

An Analyst sees analysis-related modules but does not see administrative account management features.

Frontend access control improves usability and reduces confusion by showing users only the features available to them.

### Backend Access Control

The backend enforces authorization before allowing access to protected APIs and restricted modules.

When a user sends a request to a protected backend route, the backend validates:

The user's authentication status

The user's active session

The user's assigned role

The user's tenant or company association

The user's license permissions

The requested module or action

If the user does not have the required role or license permission, the backend rejects the request.

Backend enforcement is the primary security control for authorization because it prevents unauthorized users from bypassing frontend restrictions and directly accessing protected APIs.

### Tenant-Level Access Control

Users are associated with a company or tenant. Tenant-level access control ensures that users only access the data and functionality related to their assigned tenant.

Maintainers manage tenant-level users and settings, while members and analysts operate within the boundaries of their assigned tenant and permissions.

This helps separate tenant operations and prevents users from accessing data or settings belonging to another tenant.

### Restricted Administrative Access

Administrative functions are restricted to authorized roles only.

Functions such as account creation, user management, tenant management, license assignment, system configuration, and administrative review are not available to analyst users.

This separation helps reduce unauthorized administrative activity and supports clear responsibility boundaries between administrators, maintainers, members, and analysts.

### Authorization Flow

```text
User logs in successfully
        |
        v
Backend validates authentication and session
        |
        v
System identifies user role
        |
        v
System identifies tenant/company association
        |
        v
System checks assigned license
        |
        v
Frontend displays allowed modules
        |
        v
User requests access to a module or API
        |
        v
Backend validates role and license permission
        |
        v
Request is allowed or rejected

```

### Authorization and RBAC Summary

Orion Intelligence uses role-based and license-based access control to determine what users can access after authentication. Users are assigned roles such as Admin, Maintainer, Member, or Analyst, and access to modules is further controlled by the assigned license plan.

The frontend displays only the modules allowed for the user's role and license, while the backend enforces authorization before processing protected API requests. This ensures that users can only access permitted features, tenant data, and administrative functions.

## 3.4 Encryption

### Overview

Orion Intelligence uses encryption to protect sensitive information during transmission and storage. Encryption controls are applied to help protect communication between users and the platform, as well as selected tenant-sensitive fields stored within the database.

The encryption approach focuses on two main areas:

Encryption in transit

Application-level encryption for tenant-sensitive data

### Encryption in Transit

Orion Intelligence uses HTTPS to protect communication between users and the platform. Web traffic is secured using SSL certificates managed through NGINX.

When users access the Orion web application, communication between the user's browser and the platform is encrypted in transit. This helps protect login credentials, access tokens, API requests, search queries, investigation results, and other transmitted data from unauthorized interception.

### SSL Certificates

SSL certificates are managed locally and configured through NGINX. These certificates are used to enable secure HTTPS communication between client browsers and the Orion platform.

NGINX is responsible for handling SSL traffic and supporting secure reverse-proxy behavior for platform access.

### Application-Level Encryption

Orion Intelligence applies application-level encryption to protect selected tenant-sensitive fields stored in MongoDB.

This means sensitive tenant data is encrypted before it is saved in the database and decrypted only when required for authorized API responses.

### Tenant-Specific Data Encryption

Orion uses a tenant-specific encryption model for protecting sensitive tenant fields.

The application loads a master encryption key. For each tenant, the Key Manager generates a separate Data Encryption Key, also known as a DEK. The tenant DEK is encrypted using the master key and then stored.

Tenant-sensitive fields are encrypted using the tenant DEK before being saved in MongoDB. When the data is required by an authorized user or API response, the same tenant DEK is retrieved and used to decrypt the required data.

This approach helps separate tenant encryption contexts and provides additional protection for tenant-specific information.

### Tenant Encryption Flow

```text
Application loads master encryption key
        |
        v
Key Manager generates per-tenant Data Encryption Key
        |
        v
Tenant DEK is encrypted using the master key
        |
        v
Encrypted tenant DEK is stored
        |
        v
Tenant fields are encrypted using tenant DEK
        |
        v
Encrypted tenant fields are saved in MongoDB
        |
        v
Tenant DEK is retrieved when required
        |
        v
Data is decrypted for authorized API responses

```

### MongoDB Data Protection

MongoDB stores application records, tenant settings, user-related data, reports, audit logs, and operational records. Tenant-sensitive fields within MongoDB are protected using the application-level encryption process.

The purpose of this approach is to ensure that sensitive tenant fields are not stored in readable form without passing through the application encryption and decryption process.

### Encrypted Data Handling

Encrypted tenant data is handled through the backend application layer.

Users do not directly access encrypted database records. Instead, users access data through the Orion frontend and backend APIs. The backend validates the request, verifies authorization, retrieves the required encrypted data, decrypts it where appropriate, and returns the response to the authorized user.

### Encryption Scope

The current encryption controls cover:

### Encryption Responsibilities

The Orion application is responsible for encrypting tenant-sensitive fields before storing them in MongoDB and decrypting them only when required for authorized responses.

Administrators and infrastructure personnel are responsible for maintaining SSL certificate configuration, protecting environment-level secrets, and ensuring that encryption keys are handled securely.

### Encryption Summary

Orion Intelligence protects data in transit using HTTPS and SSL certificates configured through NGINX. For stored tenant-sensitive data, Orion applies application-level encryption using a master encryption key and tenant-specific Data Encryption Keys.

This encryption model helps protect sensitive platform communication and tenant-specific database fields while ensuring that authorized users can access required information through controlled backend APIs.

## 3.5 Logging and Audit Logs

### Overview

Orion Intelligence maintains logs and audit records to support operational visibility, troubleshooting, activity review, and platform monitoring. Logging helps administrators understand system behavior, identify application issues, review user-level actions, and investigate unexpected events.

The platform maintains different types of logs, including application-level logs, error logs, exception logs, user activity logs, and audit logs available through the administrative interface.

### Logging Purpose

The purpose of logging in Orion Intelligence is to:

Record application errors and runtime exceptions.

Track system-level events and operational issues.

Maintain visibility into user-level actions.

Support troubleshooting and debugging.

Help administrators review platform activity.

Support investigation of unusual or unauthorized activity.

Maintain historical records for operational review.

### Application Logs

Application logs capture system-level information generated by Orion backend services and supporting components.

These logs may include:

Runtime errors

Backend exceptions

Failed operations

Service-level issues

Processing errors

API-related errors

System execution events

Application logs are maintained in internal log directories with timestamped records. These logs help the technical team investigate application issues and identify the source of failures or unexpected behavior.

### Error and Exception Logs

Orion captures code-level errors and exceptions generated during platform operation. These logs are used by developers and administrators to identify application defects, failed backend operations, runtime crashes, or processing failures.

Error and exception logs may include:

Error message

Timestamp

Affected service or component

Related backend operation

Exception details

Processing failure information

These records help the technical team diagnose problems and apply fixes where required.

### User Activity Logs

Orion Intelligence records user-level actions where applicable. User activity logs help administrators understand how users interact with the platform and provide visibility into important user operations.

User activity logs may include:

Login activity

Logout activity

Module access

Search activity

Administrative actions

User management actions

Tenant-related actions

Report-related actions

Configuration changes

These logs support platform accountability and help administrators review user behavior within the system.

### Audit Logs

Audit logs are maintained to provide a structured record of important platform activities. These logs are stored in the database and are available to authorized administrators through the internal Audit Logs dashboard.

The Audit Logs dashboard allows administrators to review recorded activities from within the Orion administrative interface.

Audit logs may include:

User actions

Administrative actions

Tenant-level events

Security-relevant activities

System configuration changes

Access-related events

Important operational actions

Audit logs help provide visibility into platform usage and support review of user and administrator activity.

### Log Storage

Orion uses internal storage locations and database-backed records for maintaining logs.

Application-level errors, runtime crashes, and execution exceptions are captured in internal folders with timestamped log records.

User-level actions and audit-related events are stored in the database and made available to authorized administrators through the internal Audit Logs dashboard.

### Log Access

Access to logs is restricted to authorized personnel. Regular users do not have direct access to backend logs, system logs, or administrative audit records.

Log access is generally limited to:

Platform administrators

Authorized maintainers where applicable

Developers responsible for troubleshooting

Infrastructure or operations personnel

This helps ensure that log data is reviewed only by personnel with an operational or administrative need.

### Log Retention

MongoDB logs are maintained indefinitely. This allows the platform to preserve historical operational and audit-related records for long-term review, investigation, and administrative tracking.

Application log retention may depend on the server configuration, available storage, and operational requirements.

### Logging Flow

```text
Platform activity occurs
        |
        v
Application or backend service generates log event
        |
        v
Error, exception, or user action is recorded
        |
        v
Code-level logs are stored in internal log folders
        |
        v
User-level audit events are stored in the database
        |
        v
Authorized administrators review audit logs through Admin UI

```

### Logging and Audit Summary

Orion Intelligence maintains logging and audit capabilities to support troubleshooting, operational visibility, user activity review, and administrative oversight.

Application errors and exceptions are stored in internal log folders with timestamps, while user-level actions and audit events are persisted in the database and exposed through the internal Audit Logs dashboard for authorized administrators.

This logging model helps the platform maintain visibility into system behavior, user activity, and operational events.

## 3.6 Backup and Recovery

### Overview

Orion Intelligence uses a scheduled backup approach to support recovery in the event of system failure, database corruption, infrastructure disruption, or other operational issues affecting platform availability or data integrity.

Backups are maintained to help restore the platform and its critical data when recovery is required. The backup process supports operational continuity and reduces the risk of permanent data loss.

### Backup Purpose

The purpose of the backup process is to protect Orion Intelligence data and system state by maintaining recoverable copies of critical platform information.

The backup process is designed to support recovery from situations such as:

Database corruption

VPS-level failure

Accidental data loss

Application-level failure

Infrastructure disruption

Critical system misconfiguration

Operational recovery needs

### Backup Solution

Orion Intelligence uses Hostinger for scheduled backup support.

Hostinger backups are maintained on a weekly basis and are used to preserve the platform state for disaster recovery and operational recovery purposes.

These backups provide recovery points that can be used by authorized administrators when restoration is required.

### Backup Scope

The backup process is intended to support recovery of critical Orion Intelligence components and data.

The backup scope may include:

Application data

Database data

Platform configuration

User-related records

Tenant-related records

System settings

Operational records

Application state required for recovery

The exact recovery scope depends on the available Hostinger backup configuration and the state of the platform at the time the backup is created.

### Database Backups

Orion Intelligence databases are included in the backup approach through Hostinger weekly backups.

The platform uses multiple data components, including:

MongoDB

Elasticsearch

ArangoDB

Redis

These components support different platform workloads, including document persistence, indexed search, graph analysis, caching, and task coordination. Backups help preserve the data and system state required to restore platform operations when needed.

### Recovery Process

If recovery is required, authorized administrators are responsible for initiating the restoration process using the available Hostinger backup.

The general recovery process includes:

Identify the issue requiring recovery.

Determine the most appropriate available backup point.

Restore the required system state or data from the backup.

Validate that core platform services are operational.

Confirm that users can access the platform and required modules.

Review logs and system behavior after recovery.

### Recovery Responsibilities

Backup and recovery activities are handled by authorized administrators or infrastructure personnel responsible for Orion Intelligence operations.

These personnel are responsible for:

Monitoring backup availability.

Initiating recovery when required.

Restoring platform data or system state.

Validating service functionality after recovery.

Reviewing system behavior after restoration.

Coordinating with the development or operations team if additional fixes are required.

### Backup Frequency

Orion Intelligence uses weekly backups through Hostinger.

The weekly backup schedule provides recurring recovery points that can be used in the event of operational disruption or data recovery requirements.

### Backup Access

Access to backups is restricted to authorized personnel responsible for platform administration, infrastructure management, or recovery operations.

Regular platform users do not have access to backup files, recovery controls, or backup management functions.

### Backup and Recovery Flow

```text
Orion platform operates normally
        |
        v
Hostinger creates scheduled weekly backup
        |
        v
Backup is retained as a recovery point
        |
        v
Operational issue or recovery need occurs
        |
        v
Authorized administrator selects available backup
        |
        v
System/data restoration is performed
        |
        v
Platform services are validated after recovery

```

### Backup and Recovery Summary

Orion Intelligence uses Hostinger weekly backups to support recovery from system failure, data corruption, infrastructure disruption, or other operational issues.

Backups provide recovery points for restoring critical platform data and system state. Recovery activities are performed by authorized administrators or infrastructure personnel, and backup access is restricted to authorized personnel only.

## 3.7 SOC 2 Security Compliance Readiness

### Overview

This section summarizes the current readiness of the Orion Intelligence security documentation for the SOC 2 Security trust service category. It is intended as an internal audit-readiness note and does not represent a formal compliance opinion.

### Current Readiness Assessment

The current Security Documentation provides a good security overview, but it is not enough for full SOC 2 Security audit readiness as-is.

The documentation covers useful areas, including authentication, multi-factor authentication, sessions, role-based access control, tenant isolation, encryption, logging, audit logs, and backups. These areas provide a solid foundation for the SOC 2 Security trust service category.

### Required SOC 2 Additions

The main issue is that SOC 2 expects documented controls plus evidence, not only a security narrative. The documentation should be expanded to include the following items:

SOC 2 criteria mapping, especially CC1 through CC9.

Control owner, frequency, evidence, and review cadence for each control.

Access provisioning, approval, offboarding, and periodic access reviews.

Vulnerability management, patching, dependency scanning, and penetration testing.

Incident response process, severity levels, notifications, and post-incident reviews.

Change management, including code review, approvals, testing, deployment, and rollback.

Vendor and subservice provider controls, especially Hostinger and hosting or database dependencies.

Backup details, including recovery point objectives, recovery time objectives, retention, encryption, and restore testing evidence.

Key management details, including key storage, rotation, access restrictions, and backup key handling.

Log review process, alerting, retention period, and tamper protection.

### SOC 2 Type I and Type II Readiness

For SOC 2 Type I, the current content could be turned into an acceptable draft after adding a control matrix and evidence references.

For SOC 2 Type II, the current content is not enough because operating evidence is required across the audit period.

### Recommended Control Format

A SOC 2-ready control entry should identify the control, criteria mapping, owner, frequency, evidence, and review cadence.

Control ID: SEC-01

SOC 2 Criteria: CC6.1, CC6.2

Control: MFA is required for all administrative and user accounts.

Owner: Security / Platform Admin

Frequency: Continuous

Evidence: MFA configuration screenshot, user access export, login audit logs

Review Cadence: Quarterly

### Reference

AICPA identifies the 2017 Trust Services Criteria with revised 2022 points of focus as the criteria used for evaluating controls over security, availability, processing integrity, confidentiality, and privacy.

Reference URL: https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022
