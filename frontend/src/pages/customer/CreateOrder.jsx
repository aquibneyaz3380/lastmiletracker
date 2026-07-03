// src/pages/customer/CreateOrder.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const initialForm = {
  pickupAddress: '', pickupPincode: '',
  dropAddress: '', dropPincode: '',
  length: '', breadth: '', height: '',
  actualWeight: '',
  orderType: 'B2C', paymentType: 'PREPAID',
  scheduledDate: ''
};

const CreateOrder = () => {
  const [form, setForm] = useState(initialForm);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setQuote(null);
  };

  const canQuote = () =>
    form.pickupPincode && form.dropPincode && form.length && form.breadth && form.height && form.actualWeight;

  const getQuote = async () => {
    if (!canQuote()) {
      setQuoteError('Please fill in pincode, dimensions, and weight first');
      return;
    }
    setQuoteError('');
    setQuoting(true);
    try {
      const res = await api.get('/orders/quote', { params: form });
      setQuote(res.data);
    } catch (err) {
      setQuoteError(err.response?.data?.error || 'Could not calculate quote');
    } finally {
      setQuoting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!quote) {
      setError('Please get a quote before confirming the order');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/orders', form);
      navigate(`/customer/orders/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 px-4 pb-12">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Order</h2>
      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 shadow space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
            <input name="pickupAddress" required value={form.pickupAddress} onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Pincode</label>
            <input name="pickupPincode" required value={form.pickupPincode} onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Drop Address</label>
            <input name="dropAddress" required value={form.dropAddress} onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Drop Pincode</label>
            <input name="dropPincode" required value={form.dropPincode} onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Length (cm)</label>
            <input type="number" step="0.1" name="length" required value={form.length} onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Breadth (cm)</label>
            <input type="number" step="0.1" name="breadth" required value={form.breadth} onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
            <input type="number" step="0.1" name="height" required value={form.height} onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input type="number" step="0.1" name="actualWeight" required value={form.actualWeight} onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
            <select name="orderType" value={form.orderType} onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="B2C">B2C</option>
              <option value="B2B">B2B</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
            <select name="paymentType" value={form.paymentType} onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="PREPAID">Prepaid</option>
              <option value="COD">COD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
            <input type="date" name="scheduledDate" value={form.scheduledDate} onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <button type="button" onClick={getQuote} disabled={quoting}
          className="w-full bg-gray-100 text-gray-800 py-2 rounded font-medium hover:bg-gray-200 disabled:opacity-50">
          {quoting ? 'Calculating...' : 'Get Charge Estimate'}
        </button>

        {quoteError && <p className="text-red-600 text-sm">{quoteError}</p>}

        {quote && (
          <div className="bg-brand-50 border border-brand-100 rounded-lg p-4 text-sm space-y-1">
            <p><span className="text-gray-600">Volumetric Weight:</span> <strong>{quote.volumetricWeight} kg</strong></p>
            <p><span className="text-gray-600">Chargeable Weight:</span> <strong>{quote.chargeableWeight} kg</strong></p>
            <p><span className="text-gray-600">Base Charge:</span> <strong>₹{quote.baseCharge.toFixed(2)}</strong></p>
            {quote.codSurcharge > 0 && (
              <p><span className="text-gray-600">COD Surcharge:</span> <strong>₹{quote.codSurcharge.toFixed(2)}</strong></p>
            )}
            <p className="text-base pt-2 border-t border-brand-200">
              <span className="text-gray-700">Total Charge:</span>{' '}
              <strong className="text-brand-700">₹{quote.totalCharge.toFixed(2)}</strong>
            </p>
          </div>
        )}

        <button type="submit" disabled={submitting || !quote}
          className="w-full bg-brand-600 text-white py-2.5 rounded font-medium hover:bg-brand-700 disabled:opacity-50">
          {submitting ? 'Placing Order...' : 'Confirm Order'}
        </button>
      </form>
    </div>
  );
};

export default CreateOrder;
