import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TourList from './pages/TourList';
import TourDetailQuery from './pages/TourDetailQuery';
import Layout from './components/Layout';
import BookingForm from './pages/BookingForm';
import BookingReview from './pages/BookingReview';
import PaymentPage from './pages/PaymentPage';

import PaymentQR from './pages/PaymentQR';
import PaymentThe from './pages/PaymentThe';

import BusRentalPage2 from './pages/BusRentalPage2';
import BusRentalPage3 from './pages/BusRentalPage3';
import PriceCalculatorPage from './pages/PriceCalculatorPage';
import BusRentalDone from './pages/BusRentalDone';
import BusThongTinNhaXe from './pages/BusThongTinNhaXe';
import ContactPage from './pages/ContactPage';
import SiteMap from './pages/SiteMap';
import OnlineTicket from './pages/OnlineTicket';
import AirTicketPage from './pages/AirTicketPage';
import VisaPage from './pages/VisaPage';
import HotelSearchPage from './pages/hotel/HotelSearchPage';
import HotelResultsPage from './pages/hotel/HotelResultsPage';
import HotelDetailPage from './pages/hotel/HotelDetailPage';
import WebHomePage from './pages/WebHomePage';

function App() {
  const isThueXeDeDangDomain = typeof window !== 'undefined' && /(^|\.)thuexededang\.com$/i.test(window.location.hostname || '');
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={isThueXeDeDangDomain ? <Navigate to="/thue-xe" replace /> : <HomePage />} />
          <Route path="/home" element={<WebHomePage />} />
          <Route path="/danh-sach-tour" element={<TourList />} />
          <Route path="/chi-tiet-tour" element={<TourDetailQuery />} />
          <Route path="/lich-khoi-hanh" element={React.createElement(require('./pages/LichKhoiHanh').default)} />
          <Route path="/booking" element={<BookingForm />} />
          <Route path="/xem-booking" element={<BookingReview />} />
          <Route path="/thanh-toan" element={<PaymentPage />} />
          <Route path="/thanh-toan-qr" element={<PaymentQR />} />
          <Route path="/thanh-toan-the" element={<PaymentThe />} />
          <Route path="/thue-xe" element={<BusRentalPage2 />} />
          <Route path="/thue-xe-nang-cao" element={<BusRentalPage3 />} />
          <Route path="/tinh-gia-thue-xe" element={<PriceCalculatorPage />} />
          <Route path="/thue-xe-don" element={<BusRentalDone />} />
          <Route path="/bus-rental-done/:random_code" element={<BusRentalDone />} />
          <Route path="/thong-tin-nha-xe/:randomCode" element={<BusThongTinNhaXe />} />
          <Route path="/so-do-website" element={<SiteMap />} />
          <Route path="/lien-he" element={<ContactPage />} />
          <Route path="/nhom-tour/*" element={<TourList />} />
          <Route path="/tour/*" element={<TourDetailQuery />} />
          <Route path="/bai/*" element={<ContactPage />} />
          <Route path="/mua-ve" element={<OnlineTicket />} />
          <Route path="/mua-ve-may-bay" element={<AirTicketPage />} />
          <Route path="/hotel" element={<HotelSearchPage />} />
          <Route path="/web-home" element={<WebHomePage />} />
          <Route path="/hotel/ket-qua" element={<HotelResultsPage />} />
          <Route path="/hotel/chi-tiet/:hotelSlug" element={<HotelDetailPage />} />
          <Route path="/visa" element={<VisaPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
