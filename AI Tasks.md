[x] Implement SaaS Architecture

- [x] Tenants/Organizations
  - [x] Tenant accounts are called "organizations"
  - [x] Tenant accounts are isolated from each other
  - [x] Tenant accounts can have multiple users
- [x] Users
  - [x] Users are called "users"
  - [x] Users can belong to multiple organizations
  - [x] Users can have one role per organization
- [x] Authentication
  - [x] The default authentication is email/passkey
  - [x] We also support Google OAuth, Apple OAuth, Microsoft Entra, and SAML
  - [x] For sensitive operations we require an OTP via email (e.g. verification of email, deleting an organization)
  - [x] If a passkey is not available, we require an OTP via email
- [x] Authorization/Roles
  - [x] The roles are: "owner", "admin", "member", "viewer"
  - [x] Owners can manage the organization
  - [x] Owners can manage users and give users roles, including the owner and admin role
  - [x] Admins can manage members and viewers
  - [x] Members can manage viewers
- [ ] Billing
  - [ ] We use Stripe for billing
  - [ ] We offer a free tier
  - [ ] We offer a pro tier
  - [ ] We offer an enterprise tier
  - [ ] if REQUIRE_CREDIT_CARD=true then the user will be required to enter a credit card before accessing.
  - [ ] env variable called FREE_TRIAL_TIER=false/pro/enterprise if not false start the user on the specified tier for the free trial
  - [ ] if env variable called ALLOW_FREE_TIER=true then there is a free tier that the user can access after the free trial (or immediately if no free trial)

- [x] There is a navigation bar that is consistent on all pages
- [x] The account menu is on the top right of the navigation bar
- [x] The account menu has a dropdown menu with the following options:
  - [x] Active Organization
    - [x] if multiple organizations are possible, the currently active organization is displayed
    - [x] if only one organization is possible, the organization name is displayed
    - [x] if multiple organizations are possible, a dropdown menu allows switching between organizations
  - [x] Profile
    - [x] The user's profile information is displayed
    - [x] The user can edit their profile information
  - [x] Organization Admin (if owner)
  - [x] Billing (if owner)
  - [x] Logout

[x] Signup 
    [x] if the user is not logged in and does not have an account, the user can sign up
    [x] the signup page first gets their email address and then sends a verification email to the email address with an otp
    [x] once the otp is verified it creates a user and organization and logs the user in, putting the user on a free trial for the organization
    [x] the new user is given an owner role in the organization

[x] If not logged in, redirect to login page
[x] If logged in, redirect to home page
[x] login form needs a signup link if the env variable ALLOW_SIGNUP=true.

[x] Sysadmin
    [x] The sysadmin can view/edit/delete all organizations and users
    [x] Sysadmin access is determined by an environment variable that matches the email address of the sysadmins
    [x] A sysadmin must verify with an OTP via email every 60 minutes