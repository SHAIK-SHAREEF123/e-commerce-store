import { Product } from "../models/product.model.js";
import User from "../models/user.model.js"
import Order from "../models/order.model.js"

export const getAnalyticsData = async() => {
    const totalUsers = await User.countDocuments(); //return total users
    const totalProducts = await Product.countDocuments();

    const salesData = await Order.aggregate([
        {
            $group: {
                _id:null,
                totalSales: {$sum:1},
                totalRevenue: {$sum:"$totalAmount"}
            }
        }
    ])

   const { totalSales = 0, totalRevenue = 0 } = salesData[0] || {};

    return {
        users:totalUsers,
        products:totalProducts,
        totalSales,
        totalRevenue,
    }
}

export const getDailySalesData = async (startDate, endDate) => { //Donb't need to be memorize the below mongoose or mongoDB syntax ok
	try {
		const dailySalesData = await Order.aggregate([
			{
				$match: {
					createdAt: {
						$gte: startDate,
						$lte: endDate,
					},
				},
			},
			{
				$group: {
					_id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
					sales: { $sum: 1 },
					revenue: { $sum: "$totalAmount" },
				},
			},
			{ $sort: { _id: 1 } },
		]);

		// example of dailySalesData
		// [
		// 	{
		// 		_id: "2024-08-18",
		// 		sales: 12,
		// 		revenue: 1450.75
		// 	},
		// ]

		const dateArray = getDatesInRange(startDate, endDate);
		// console.log(dateArray);

		return dateArray.map((date) => {
			const foundData = dailySalesData.find((item) => item._id === date);

			return {
				date,
				sales: foundData?.sales || 0,
				revenue: foundData?.revenue || 0,
			};
		});
	} catch (error) {
		throw error;
	}
};

function getDatesInRange(startDate, endDate) { //Chat gpt
	const dates = [];
	let currentDate = new Date(startDate);

	while (currentDate <= endDate) {
		dates.push(currentDate.toISOString().split("T")[0]);
		currentDate.setDate(currentDate.getDate() + 1);
	}

	return dates;
}