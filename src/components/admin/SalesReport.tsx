// @ts-nocheck
// TODO: Fix jsPDF type errors
"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { FileDown, Filter } from "lucide-react";
import type { Order } from "../../contexts/AuthContext";
import { getProducts } from "../../lib/products";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface SalesReportProps {
  orders: Order[];
}

export function SalesReport({ orders }: SalesReportProps) {
  const [dateRange, setDateRange] = useState<
    "today" | "week" | "month" | "year" | "all"
  >("month");
  const [showDateRangePopover, setShowDateRangePopover] = useState(false);

  const products = getProducts();

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const filterDate = new Date();

    switch (dateRange) {
      case "today":
        filterDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        filterDate.setDate(now.getDate() - 7);
        break;
      case "month":
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      case "all":
        return orders;
    }

    return orders.filter((order) => new Date(order.createdAt) >= filterDate);
  }, [orders, dateRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const completedOrders = filteredOrders.filter(
      (o) => o.status === "completed",
    );
    const reservedOrders = filteredOrders.filter(
      (o) => o.status === "reserved",
    );
    const pendingOrders = filteredOrders.filter((o) => o.status === "pending");
    const processingOrders = filteredOrders.filter(
      (o) => o.status === "processing",
    );

    const completedRevenue = completedOrders.reduce(
      (sum, order) => sum + order.total,
      0,
    );
    const reservedRevenue = reservedOrders.reduce(
      (sum, order) => sum + (order.reservationFee || 0),
      0,
    );
    const totalRevenue = completedRevenue + reservedRevenue;

    const totalOrders = filteredOrders.length;
    const averageOrderValue =
      completedOrders.length > 0
        ? completedRevenue / completedOrders.length
        : 0;

    const productsSold = completedOrders.reduce(
      (sum, order) =>
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    );

    // Top selling products
    const productSales = completedOrders.reduce(
      (acc, order) => {
        order.items.forEach((item) => {
          if (!acc[item.productId]) {
            acc[item.productId] = {
              name: item.name,
              quantity: 0,
              revenue: 0,
            };
          }
          acc[item.productId].quantity += item.quantity;
          acc[item.productId].revenue += item.price * item.quantity;
        });
        return acc;
      },
      {} as Record<number, { name: string; quantity: number; revenue: number }>,
    );

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ productId: id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Daily sales
    const dailySales = completedOrders.reduce(
      (acc, order) => {
        const date = new Date(order.createdAt).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { orders: 0, revenue: 0 };
        }
        acc[date].orders += 1;
        acc[date].revenue += order.total;
        return acc;
      },
      {} as Record<string, { orders: number; revenue: number }>,
    );

    return {
      totalRevenue,
      totalOrders,
      completedOrders: completedOrders.length,
      reservedOrders: reservedOrders.length,
      pendingOrders: pendingOrders.length,
      processingOrders: processingOrders.length,
      averageOrderValue,
      productsSold,
      topProducts,
      dailySales,
    };
  }, [filteredOrders]);

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20;

    // Header with logo and company info
    doc.setFillColor(139, 69, 19); // Brown color
    doc.rect(0, 0, pageWidth, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("POYBASH FURNITURE", pageWidth / 2, 15, { align: "center" });

    doc.setFontSize(10);
    doc.text("Sales Report Summary", pageWidth / 2, 23, { align: "center" });

    // Report metadata
    doc.setTextColor(0, 0, 0);
    yPos = 45;

    const dateRangeText =
      dateRange === "today"
        ? "Today"
        : dateRange === "week"
          ? "Last 7 Days"
          : dateRange === "month"
            ? "Last 30 Days"
            : dateRange === "year"
              ? "Last Year"
              : "All Time";

    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Report Details", 14, yPos);
    doc.setFont(undefined, "normal");
    doc.setFontSize(9);
    yPos += 6;
    doc.text(`Report Period: ${dateRangeText}`, 14, yPos);
    yPos += 5;
    doc.text(
      `Generated: ${new Date().toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      14,
      yPos,
    );
    yPos += 5;
    doc.text(`Report Type: Summary Analysis`, 14, yPos);

    yPos += 12;

    // Divider line
    doc.setDrawColor(139, 69, 19);
    doc.setLineWidth(0.5);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 8;

    // Key Metrics Section
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.setTextColor(139, 69, 19);
    doc.text("KEY PERFORMANCE INDICATORS", 14, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, "normal");
    yPos += 10;

    const summaryMetrics = [
      [
        "Total Revenue",
        `₱${metrics.totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ],
      ["Total Orders", `${metrics.totalOrders} orders`],
      ["Completed Orders", `${metrics.completedOrders} orders`],
      ["Reserved Orders", `${metrics.reservedOrders} orders (partial payment)`],
      ["Pending Orders", `${metrics.pendingOrders} orders`],
      ["Processing Orders", `${metrics.processingOrders} orders`],
      [
        "Average Order Value",
        `₱${metrics.averageOrderValue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ],
      ["Total Products Sold", `${metrics.productsSold} units`],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [["Metric", "Value"]],
      body: summaryMetrics,
      theme: "striped",
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [139, 69, 19],
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 220], // Beige
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 100 },
        1: { halign: "right", cellWidth: 80 },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Top Selling Products
    if (metrics.topProducts.length > 0) {
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.setTextColor(139, 69, 19);
      doc.text("TOP SELLING PRODUCTS", 14, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, "normal");
      yPos += 10;

      const topProductData = metrics.topProducts.map((product, index) => [
        `${index + 1}`,
        product.name,
        `${product.quantity} units`,
        `₱${product.revenue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `${((product.revenue / metrics.totalRevenue) * 100).toFixed(1)}%`,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Rank", "Product Name", "Units Sold", "Revenue", "% of Total"]],
        body: topProductData,
        theme: "striped",
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        headStyles: {
          fillColor: [139, 69, 19],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 220],
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 20 },
          1: { cellWidth: 70 },
          2: { halign: "center", cellWidth: 30 },
          3: { halign: "right", cellWidth: 40 },
          4: { halign: "center", cellWidth: 30 },
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Daily Sales Breakdown
    if (Object.keys(metrics.dailySales).length > 0) {
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.setTextColor(139, 69, 19);
      doc.text("DAILY SALES BREAKDOWN", 14, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, "normal");
      yPos += 10;

      const dailyData = Object.entries(metrics.dailySales)
        .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
        .map(([date, data]) => {
          const avgOrderValue =
            data.orders > 0 ? data.revenue / data.orders : 0;
          return [
            new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            `${data.orders}`,
            `₱${data.revenue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            `₱${avgOrderValue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          ];
        });

      autoTable(doc, {
        startY: yPos,
        head: [["Date", "Orders", "Revenue", "Avg Order Value"]],
        body: dailyData,
        theme: "striped",
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        headStyles: {
          fillColor: [139, 69, 19],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 220],
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { halign: "center", cellWidth: 30 },
          2: { halign: "right", cellWidth: 50 },
          3: { halign: "right", cellWidth: 50 },
        },
      });
    }

    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Footer background
      doc.setFillColor(245, 245, 220); // Beige
      doc.rect(0, pageHeight - 20, pageWidth, 20, "F");

      // Footer text
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, {
        align: "center",
      });
      doc.text(
        "PoyBash Furniture - Confidential Document",
        14,
        pageHeight - 10,
      );
      doc.text(
        new Date().toLocaleDateString(),
        pageWidth - 14,
        pageHeight - 10,
        { align: "right" },
      );
    }

    // Save PDF with descriptive filename
    const fileName = `PoyBash-Sales-Report-${dateRangeText.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
    toast.success("Sales report generated", {
      description: "Your PDF has been downloaded successfully.",
    });
  };

  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case "today":
        return "Today";
      case "week":
        return "Last 7 Days";
      case "month":
        return "Last 30 Days";
      case "year":
        return "Last Year";
      case "all":
        return "All Time";
      default:
        return "Last 30 Days";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sales Reports</CardTitle>
            <CardDescription>
              Generate comprehensive sales reports for analysis
            </CardDescription>
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <div className="space-y-2 flex-1">
            <Label htmlFor="dateRange">Date Range</Label>
            <Popover
              open={showDateRangePopover}
              onOpenChange={setShowDateRangePopover}
            >
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {getDateRangeLabel(dateRange)}
                  <Filter className="h-4 w-4 ml-2 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[343px] p-0" align="start">
                <div className="space-y-1">
                  <div className="p-3 border-b">
                    <p className="text-sm font-medium">Select Date Range</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <Button
                      variant={dateRange === "today" ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setDateRange("today")}
                    >
                      Today
                    </Button>
                    <Button
                      variant={dateRange === "week" ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setDateRange("week")}
                    >
                      Last 7 Days
                    </Button>
                    <Button
                      variant={dateRange === "month" ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setDateRange("month")}
                    >
                      Last 30 Days
                    </Button>
                    <Button
                      variant={dateRange === "year" ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setDateRange("year")}
                    >
                      Last Year
                    </Button>
                    <Button
                      variant={dateRange === "all" ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setDateRange("all")}
                    >
                      All Time
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-end">
            <Button onClick={generatePDF} size="lg">
              <FileDown className="h-5 w-5 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="py-4">
          <p className="text-sm text-muted-foreground text-center">
            Select a date range and click "Generate Report" to create a
            comprehensive PDF document with all key metrics, top selling
            products, and daily sales breakdown.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
