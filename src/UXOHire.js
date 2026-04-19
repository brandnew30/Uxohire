import styles from "./styles/theme";
import useAppState from "./utils/useAppState";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import JobsView from "./pages/JobsView";
import JobDetail from "./pages/JobDetail";
import TechsView from "./pages/TechsView";
import TechDetail from "./pages/TechDetail";
import CreateProfile from "./pages/CreateProfile";
import PostJob from "./pages/PostJob";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import MyProfile from "./pages/MyProfile";
import JobPostSuccess from "./pages/JobPostSuccess";

export default function UXOHire({ user: userProp }) {
  const s = useAppState(userProp);

  return (
    <div style={styles.root}>
      <Navbar view={s.view} setView={s.setView} user={s.user} myProfile={s.myProfile} navigate={s.navigate} onSignOut={s.handleSignOut} accountType={s.accountType} />

      <main style={styles.main} data-main-container>
        {s.authSuccessMsg && (
          <div style={{ background: '#1a4a2e', border: '1px solid #4ade80', borderRadius: 8, padding: '14px 18px', color: '#4ade80', fontSize: 14, margin: '16px 0 0' }}>
            {"\u2705"} {s.authSuccessMsg}
          </div>
        )}

        {s.view === "jobs" && !s.activeJob && (
          <JobsView filteredJobs={s.filteredJobs} filterCert={s.filterCert} setFilterCert={s.setFilterCert}
            filterLocation={s.filterLocation} setFilterLocation={s.setFilterLocation}
            dataLoading={s.dataLoading} setActiveJob={s.setActiveJob}
            goToCreateProfile={s.goToCreateProfile} setView={s.setView}
            user={s.user} myProfile={s.myProfile} navigate={s.navigate} />
        )}

        {s.view === "jobs" && s.activeJob && (
          <JobDetail job={s.activeJob} myProfile={s.myProfile} user={s.user} onBack={() => s.setActiveJob(null)} />
        )}

        {s.view === "techs" && !s.activeTech && (
          <TechsView techs={s.techs} setActiveTech={s.setActiveTech} goToCreateProfile={s.goToCreateProfile}
            user={s.user} myProfile={s.myProfile} navigate={s.navigate}
            accountType={s.accountType} isPaidEmployer={s.isPaidEmployer} />
        )}

        {s.view === "techs" && s.activeTech && (
          <TechDetail tech={s.activeTech} user={s.user} onBack={() => s.setActiveTech(null)}
            accountType={s.accountType} isPaidEmployer={s.isPaidEmployer} />
        )}

        {s.view === "techProfile" && (
          <CreateProfile profile={s.profile} setProfile={s.setProfile}
            profileStep={s.profileStep} setProfileStep={s.setProfileStep}
            openToWork={s.openToWork} setOpenToWork={s.setOpenToWork}
            notifications={s.notifications} errors={s.errors} setErrors={s.setErrors}
            uploadStatus={s.uploadStatus} setUploadStatus={s.setUploadStatus}
            uploadPaths={s.uploadPaths} setUploadPaths={s.setUploadPaths}
            submitError={s.submitError} user={s.user} myProfile={s.myProfile}
            onSubmit={s.handleSubmitProfile} onBack={() => s.setView("jobs")} />
        )}

        {s.view === "postJob" && (
          <PostJob jobPost={s.jobPost} setJobPost={s.setJobPost}
            postStep={s.postStep} setPostStep={s.setPostStep}
            submitError={s.submitError} paymentLoading={s.paymentLoading}
            onSubmit={s.handleSubmitJobPost} onBack={() => s.setView("jobs")} />
        )}

        {s.view === "jobPostSuccess" && (
          <JobPostSuccess onReset={() => {
            s.setPostStep(1);
            s.setJobPost({ company: "", title: "", location: "", type: "Contract", salary: "", description: "", requiredCerts: [], preferredCerts: [] });
            s.setView("jobs");
          }} />
        )}

        {s.view === 'login' && (
          <LoginPage authForm={s.authForm} setAuthForm={s.setAuthForm} authError={s.authError}
            authLoading={s.authLoading} onLogin={s.handleLogin}
            onBack={() => { s.setView('jobs'); }}
            onSwitchToSignup={() => { s.setView('signup'); }}
            onForgotPassword={() => { s.setView('forgotPassword'); }}
            resetSuccess={s.resetSuccess} />
        )}

        {s.view === 'forgotPassword' && (
          <ForgotPasswordPage
            onBack={() => { s.setView('jobs'); }}
            onSwitchToLogin={() => { s.setView('login'); }} />
        )}

        {s.view === 'signup' && (
          <SignupPage authForm={s.authForm} setAuthForm={s.setAuthForm} authError={s.authError}
            authLoading={s.authLoading} onSignUp={s.handleSignUp}
            onBack={() => { s.setView('jobs'); }}
            onSwitchToLogin={() => { s.setView('login'); }} />
        )}

        {s.view === 'myProfile' && (
          <MyProfile user={s.user} myProfile={s.myProfile} myProfileLoading={s.myProfileLoading}
            onToggleAvailability={s.handleToggleAvailability}
            goToCreateProfile={s.goToCreateProfile} navigate={s.navigate}
            onBack={() => s.setView('jobs')} />
        )}
      </main>

      <Footer />
    </div>
  );
}
