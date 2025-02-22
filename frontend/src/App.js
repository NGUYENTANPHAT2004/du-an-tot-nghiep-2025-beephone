import React, { Fragment } from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { publicRoutes } from './router';
import { DefaultLayout } from './Layout/DeafaultLayout'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {publicRoutes.map((route, index) => {
            let Layout = DefaultLayout;
            const Page = route.component;

            // Nếu route có layout được set là null
            if (route.layout === null) {
              Layout = Fragment;
            }

            return (
              <Route
                key={index}
                path={route.path}
                element={
                  <Layout>
                    <Page />
                  </Layout>
                }
              />
            );
          })}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
