import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';

const DoanhThuChart = ({ data }) => (
  <div className='doanhthu-chart-wrapper'>
    <h3 className='doanhthu-chart-title'>Biểu đồ Doanh thu theo ngày</h3>
    <ResponsiveContainer width='100%' height={500}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis dataKey='ngay' />
        <YAxis tickFormatter={v => (v / 1e6).toFixed(1) + 'M'} />
        <Tooltip formatter={v => [(v / 1e6).toFixed(1) + 'M', 'Doanh thu']} />
        <Bar dataKey='doanhthu' fill='#1092FC'>
          <LabelList dataKey='doanhthu' position='top' formatter={v => (v / 1e6).toFixed(1) + 'M'} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default DoanhThuChart;
