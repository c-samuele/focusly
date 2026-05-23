// Layout principale a 2 colonne con header sticky.
// Gestisce responsività: desktop (sidebar fixed), tablet/mobile (drawer).
function DashboardLayout({ header, sidebar, mainContent }) {
  return (
    <div className="dashboard-layout-container">
      {/* Sticky Header */}
      {header}

      {/* Main Layout (Sidebar + Content) */}
      <div className="dashboard-layout">
        {/* Sidebar */}
        {sidebar}

        {/* Main Content */}
        {mainContent}
      </div>
    </div>
  );
}

export default DashboardLayout;
