import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking, Alert, Platform } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useRoute } from '@react-navigation/native'
import { scale, moderateScale, verticalScale } from 'react-native-size-matters'
import Icon from '../../../utils/icon'
import TextComp from '../../components/textComp'
import Wrapper from '../../components/wrapper'
import { COLORS } from '../../../res/colors'
import { width } from '../../hooks/responsive'

// import Icon from '../components/Icon'
// import TextComp from '../components/CustomText'
// import Wrapper from '../components/Wrapper'
// import { COLORS, width } from '../utils'

const Invoice = () => {
    const route = useRoute()
    const { billInfo } = route.params || {}
    const [invoiceData, setInvoiceData] = useState(null)

    useEffect(() => {
        if (billInfo) {
            setInvoiceData(billInfo)
        }
    }, [billInfo])

    const handlePrintInvoice = async () => {
        try {
            // For web/desktop printing
            if (Platform.OS === 'web') {
                window.print();
                return;
            }

            // For mobile - generate PDF and share or open in print dialog
            Alert.alert(
                "Print Invoice",
                "Choose an option to print or share the invoice",
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Generate PDF",
                        onPress: generateAndSharePDF
                    },
                    {
                        text: "Send via Email",
                        onPress: () => sendViaEmail()
                    }
                ]
            )
        } catch (error) {
            console.error('Print error:', error)
            Alert.alert("Error", "Unable to print invoice")
        }
    }

    const generateAndSharePDF = () => {
        // In a real app, you would generate a PDF here using a library like react-native-html-to-pdf
        // For now, we'll just share the invoice text
        const invoiceText = generateInvoiceText()

        Alert.alert(
            "PDF Generated",
            "In a real implementation, this would generate and share a PDF file. Current text:",
            [{ text: "OK" }]
        )

        // For demo, show the invoice text
        console.log(invoiceText)
    }

    const sendViaEmail = () => {
        const emailSubject = `Invoice - ${invoiceData.orderDetails.order_number}`
        const emailBody = generateEmailBody()

        Linking.openURL(`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`)
            .catch(() => Alert.alert("Error", "No email app found"))
    }

    const generateInvoiceText = () => {
        if (!invoiceData) return ""

        const { orderDetails, items, summary, userDetails } = invoiceData

        let text = `
INVOICE
======================
Invoice No: ${orderDetails.order_number}
Date: ${orderDetails.order_date}
Time: ${orderDetails.order_datetime.split(' ')[1]}
Status: ${orderDetails.status.toUpperCase()}
Payment: ${orderDetails.payment_type.toUpperCase()}

CUSTOMER DETAILS
======================
Name: ${userDetails.name}
Business: ${userDetails.business_name}
GST: ${userDetails.gst_number}
Address: ${userDetails.address}
City: ${userDetails.city}, ${userDetails.state}
PIN: ${userDetails.postal_code}

ITEMS
======================
`

        items.forEach((item, index) => {
            text += `
${index + 1}. ${item.product_name}
   Brand: ${item.brand_name}
   Size: ${item.variant_size || 'N/A'}
   Qty: ${item.quantity} ${item.unit}
   Price: ₹${item.final_price.toFixed(2)}
   Tax (${item.tax_percent}%): ₹${item.tax_amount.toFixed(2)}
   Total: ₹${item.item_total.toFixed(2)}
`
        })

        text += `
SUMMARY
======================
Subtotal: ₹${summary.subtotal.toFixed(2)}
Tax (${summary.tax_type}): ₹${summary.total_tax.toFixed(2)}
Round Off: ₹${summary.round_off.toFixed(2)}
GRAND TOTAL: ₹${summary.grand_total.toFixed(2)}

Payment Status: ${orderDetails.payment_status.toUpperCase()}
Thank you for your business!
`

        return text
    }

    const generateEmailBody = () => {
        return `Dear ${invoiceData.userDetails.name},

Please find attached your invoice details:

Order Number: ${invoiceData.orderDetails.order_number}
Order Date: ${invoiceData.orderDetails.order_date}
Total Amount: ₹${invoiceData.summary.grand_total.toFixed(2)}

For any queries, please contact our support team.

Thank you for your business!

Best regards,
Abhishek Dev Works Team`
    }

    const renderInvoiceHeader = () => {
        return (
            <View style={styles.invoiceHeader}>
                <View style={styles.companyInfo}>
                    <TextComp style={styles.companyName}>Abhishek Dev Works</TextComp>
                    <TextComp style={styles.companyAddress}>Noida 62, Uttar Pradesh</TextComp>
                    <TextComp style={styles.companyGST}>GST: 29EEEEE4444E5Z1</TextComp>
                </View>

                <View style={styles.invoiceTitleContainer}>
                    <TextComp style={styles.invoiceTitle}>TAX INVOICE</TextComp>
                    <View style={styles.invoiceNumberContainer}>
                        <TextComp style={styles.invoiceNumberLabel}>Invoice No:</TextComp>
                        <TextComp style={styles.invoiceNumber}>{invoiceData.orderDetails.order_number}</TextComp>
                    </View>
                </View>
            </View>
        )
    }

    const renderOrderInfo = () => {
        return (
            <View style={styles.orderInfoContainer}>
                <View style={styles.infoSection}>
                    <TextComp style={styles.sectionLabel}>Order Information</TextComp>
                    <View style={styles.infoRow}>
                        <TextComp style={styles.infoLabel}>Order Date:</TextComp>
                        <TextComp style={styles.infoValue}>{invoiceData.orderDetails.order_date}</TextComp>
                    </View>
                    <View style={styles.infoRow}>
                        <TextComp style={styles.infoLabel}>Order Time:</TextComp>
                        <TextComp style={styles.infoValue}>
                            {invoiceData.orderDetails.order_datetime.split(' ')[1]}
                        </TextComp>
                    </View>
                    <View style={styles.infoRow}>
                        <TextComp style={styles.infoLabel}>Payment Type:</TextComp>
                        <TextComp style={styles.infoValue}>
                            {invoiceData.orderDetails.payment_type.toUpperCase()}
                        </TextComp>
                    </View>
                    <View style={styles.infoRow}>
                        <TextComp style={styles.infoLabel}>Status:</TextComp>
                        <View style={[styles.statusBadge,
                        { backgroundColor: getStatusColor(invoiceData.orderDetails.status) }]}>
                            <TextComp style={styles.statusText}>
                                {invoiceData.orderDetails.status.toUpperCase()}
                            </TextComp>
                        </View>
                    </View>
                </View>

                <View style={styles.infoSection}>
                    <TextComp style={styles.sectionLabel}>Bill To</TextComp>
                    <View style={styles.infoRow}>
                        <TextComp style={styles.infoValueBold}>{invoiceData.userDetails.name}</TextComp>
                    </View>
                    <View style={styles.infoRow}>
                        <TextComp style={styles.infoValue}>{invoiceData.userDetails.business_name}</TextComp>
                    </View>
                    <View style={styles.infoRow}>
                        <TextComp style={styles.infoValue}>{invoiceData.userDetails.address}</TextComp>
                    </View>
                    <View style={styles.infoRow}>
                        <TextComp style={styles.infoValue}>
                            {invoiceData.userDetails.city}, {invoiceData.userDetails.state} - {invoiceData.userDetails.postal_code}
                        </TextComp>
                    </View>
                    <View style={styles.infoRow}>
                        <TextComp style={styles.infoLabel}>GST:</TextComp>
                        <TextComp style={styles.infoValue}>{invoiceData.userDetails.gst_number}</TextComp>
                    </View>
                </View>
            </View>
        )
    }

    const renderItemsTable = () => {
        return (
            <View style={styles.tableContainer}>
                <View style={styles.tableHeader}>
                    <View style={[styles.tableCell, styles.serialCell]}>
                        <TextComp style={styles.tableHeaderText}>#</TextComp>
                    </View>
                    <View style={[styles.tableCell, styles.descriptionCell]}>
                        <TextComp style={styles.tableHeaderText}>Description</TextComp>
                    </View>
                    <View style={[styles.tableCell, styles.qtyCell]}>
                        <TextComp style={styles.tableHeaderText}>Qty</TextComp>
                    </View>
                    <View style={[styles.tableCell, styles.priceCell]}>
                        <TextComp style={styles.tableHeaderText}>Price</TextComp>
                    </View>
                    <View style={[styles.tableCell, styles.taxCell]}>
                        <TextComp style={styles.tableHeaderText}>Tax</TextComp>
                    </View>
                    <View style={[styles.tableCell, styles.totalCell]}>
                        <TextComp style={styles.tableHeaderText}>Total</TextComp>
                    </View>
                </View>

                {invoiceData.items.map((item, index) => (
                    <View key={`${item.product_id}-${index}`} style={styles.tableRow}>
                        <View style={[styles.tableCell, styles.serialCell]}>
                            <TextComp style={styles.tableCellText}>{index + 1}</TextComp>
                        </View>
                        <View style={[styles.tableCell, styles.descriptionCell]}>
                            <TextComp style={styles.productNameCell}>{item.product_name}</TextComp>
                            <TextComp style={styles.brandCell}>{item.brand_name}</TextComp>
                            {item.variant_size && (
                                <TextComp style={styles.variantCell}>Size: {item.variant_size}</TextComp>
                            )}
                        </View>
                        <View style={[styles.tableCell, styles.qtyCell]}>
                            <TextComp style={styles.tableCellText}>{item.quantity}</TextComp>
                            <TextComp style={styles.unitText}>{item.unit}</TextComp>
                        </View>
                        <View style={[styles.tableCell, styles.priceCell]}>
                            <TextComp style={styles.tableCellText}>₹{item.final_price.toFixed(2)}</TextComp>
                        </View>
                        <View style={[styles.tableCell, styles.taxCell]}>
                            <TextComp style={styles.tableCellText}>{item.tax_percent}%</TextComp>
                            <TextComp style={styles.taxAmountText}>₹{item.tax_amount.toFixed(2)}</TextComp>
                        </View>
                        <View style={[styles.tableCell, styles.totalCell]}>
                            <TextComp style={styles.totalCellText}>₹{item.item_total.toFixed(2)}</TextComp>
                        </View>
                    </View>
                ))}
            </View>
        )
    }

    // const renderMobileItemsTable = () => {
    //     return (
    //         <View style={styles.mobileTableContainer}>
    //             {invoiceData.items.map((item, index) => (
    //                 <View key={`${item.product_id}-${index}`} style={styles.mobileItemCard}>
    //                     {/* Row 1: Product Info */}
    //                     <View style={styles.mobileRow1}>
    //                         <TextComp style={styles.mobileSerial}>{index + 1}.</TextComp>
    //                         <View style={styles.mobileProductInfo}>
    //                             <TextComp style={styles.mobileProductName} numberOfLines={2}>
    //                                 {item.product_name}
    //                             </TextComp>
    //                             <TextComp style={styles.mobileBrand}>
    //                                 {item.brand_name} {item.variant_size ? `• ${item.variant_size}` : ''}
    //                             </TextComp>
    //                         </View>
    //                     </View>

    //                     {/* Row 2: Price Details */}
    //                     <View style={styles.mobileRow2}>
    //                         <View style={styles.mobileQuantity}>
    //                             <TextComp style={styles.mobileQtyText}>{item.quantity} {item.unit}</TextComp>
    //                         </View>
    //                         <View style={styles.mobilePriceDetails}>
    //                             <TextComp style={styles.mobilePrice}>₹{item.final_price.toFixed(2)}</TextComp>
    //                             <TextComp style={styles.mobileTax}>+ {item.tax_percent}% tax</TextComp>
    //                         </View>
    //                         <TextComp style={styles.mobileTotal}>₹{item.item_total.toFixed(2)}</TextComp>
    //                     </View>
    //                 </View>
    //             ))}
    //         </View>
    //     )
    // }

    const renderSummary = () => {
        return (
            <View style={styles.summaryContainer}>
                <View style={styles.summarySection}>
                    <View style={styles.summaryRow}>
                        <TextComp style={styles.summaryLabel}>Subtotal:</TextComp>
                        <TextComp style={styles.summaryValue}>
                            ₹{invoiceData.summary.subtotal.toFixed(2)}
                        </TextComp>
                    </View>

                    {invoiceData.summary.total_discount > 0 && (
                        <View style={styles.summaryRow}>
                            <TextComp style={styles.summaryLabel}>Discount:</TextComp>
                            <TextComp style={[styles.summaryValue, { color: COLORS.green }]}>
                                -₹{invoiceData.summary.total_discount.toFixed(2)}
                            </TextComp>
                        </View>
                    )}

                    <View style={styles.summaryRow}>
                        <TextComp style={styles.summaryLabel}>Tax ({invoiceData.summary.tax_type}):</TextComp>
                        <TextComp style={styles.summaryValue}>
                            ₹{invoiceData.summary.total_tax.toFixed(2)}
                        </TextComp>
                    </View>

                    {invoiceData.summary.round_off !== 0 && (
                        <View style={styles.summaryRow}>
                            <TextComp style={styles.summaryLabel}>Round Off:</TextComp>
                            <TextComp style={styles.summaryValue}>
                                {invoiceData.summary.round_off > 0 ? '+' : ''}₹{invoiceData.summary.round_off.toFixed(2)}
                            </TextComp>
                        </View>
                    )}

                    <View style={[styles.summaryRow, styles.grandTotalRow]}>
                        <TextComp style={styles.grandTotalLabel}>GRAND TOTAL:</TextComp>
                        <TextComp style={styles.grandTotalValue}>
                            ₹{invoiceData.summary.grand_total.toFixed(2)}
                        </TextComp>
                    </View>
                </View>

                <View style={styles.paymentInfo}>
                    <TextComp style={styles.paymentLabel}>Payment Status:</TextComp>
                    <View style={[styles.paymentStatus,
                    { backgroundColor: invoiceData.orderDetails.payment_status === 'paid' ? COLORS.green : COLORS.redOpacity(0.1) }]}>
                        <TextComp style={[
                            styles.paymentStatusText,
                            { color: invoiceData.orderDetails.payment_status === 'paid' ? COLORS.white : COLORS.red }
                        ]}>
                            {invoiceData.orderDetails.payment_status.toUpperCase()}
                        </TextComp>
                    </View>
                </View>
            </View>
        )
    }

    const renderFooter = () => {
        return (
            <View style={styles.footer}>
                <View style={styles.termsContainer}>
                    <TextComp style={styles.termsTitle}>Terms & Conditions:</TextComp>
                    <TextComp style={styles.termsText}>
                        1. Goods once sold will not be taken back.
                    </TextComp>
                    <TextComp style={styles.termsText}>
                        2. Payment due within 30 days of invoice date.
                    </TextComp>
                    <TextComp style={styles.termsText}>
                        3. Subject to Noida jurisdiction.
                    </TextComp>
                </View>

                <View style={styles.signatureContainer}>
                    <View style={styles.signatureLine} />
                    <TextComp style={styles.signatureText}>Authorized Signature</TextComp>
                </View>

                <View style={styles.thankYouContainer}>
                    <Icon name="check-circle" type="FontAwesome" size={scale(24)} color={COLORS.green} />
                    <TextComp style={styles.thankYouText}>Thank you for your business!</TextComp>
                </View>
            </View>
        )
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return COLORS.yellow;
            case 'confirmed': return COLORS.blue;
            case 'shipped': return COLORS.primaryAppColor;
            case 'delivered': return COLORS.green;
            case 'cancelled': return COLORS.red;
            default: return COLORS.secondaryTextColor;
        }
    }

    if (!invoiceData) {
        return (
            <Wrapper>
                <View style={styles.emptyContainer}>
                    <Icon name="receipt" type="MaterialIcons" size={scale(60)} color={COLORS.secondaryTextColor} />
                    <TextComp style={styles.emptyText}>No invoice data available</TextComp>
                </View>
            </Wrapper>
        )
    }

    return (
        <Wrapper>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Print Button */}
                <TouchableOpacity
                    style={styles.printButton}
                    onPress={handlePrintInvoice}
                    activeOpacity={0.8}
                >
                    <Icon
                        name="printer"
                        type="Feather"
                        size={scale(18)}
                        color={COLORS.white}
                    />
                    <TextComp style={styles.printButtonText}>Print Invoice</TextComp>
                </TouchableOpacity>

                {/* Invoice Content */}
                <View style={styles.invoiceContent}>
                    {renderInvoiceHeader()}
                    {renderOrderInfo()}
                    {renderItemsTable()}
                    {renderSummary()}
                    {renderFooter()}
                </View>
            </ScrollView>
        </Wrapper>
    )
}

export default Invoice

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: COLORS.white,
    },
    scrollContent: {
        paddingBottom: moderateScale(40),
    },
    printButton: {
        backgroundColor: COLORS.primaryAppColor,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: moderateScale(12),
        borderRadius: moderateScale(8),
        marginHorizontal: moderateScale(20),
        marginTop: moderateScale(16),
        marginBottom: moderateScale(16),
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    printButtonText: {
        color: COLORS.white,
        fontSize: scale(15),
        fontWeight: '600',
        marginLeft: moderateScale(8),
    },
    invoiceContent: {
        backgroundColor: COLORS.white,
        marginHorizontal: moderateScale(20),
        padding: moderateScale(20),
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    invoiceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: moderateScale(24),
        borderBottomWidth: 2,
        borderBottomColor: COLORS.primaryAppColor,
        paddingBottom: moderateScale(16),
    },
    companyInfo: {
        flex: 1,
    },
    companyName: {
        fontSize: scale(18),
        fontWeight: '700',
        color: COLORS.secondaryAppColor,
        marginBottom: moderateScale(4),
    },
    companyAddress: {
        fontSize: scale(12),
        color: COLORS.secondaryTextColor,
        marginBottom: moderateScale(2),
    },
    companyGST: {
        fontSize: scale(11),
        color: COLORS.primaryTextColor,
        fontWeight: '500',
    },
    invoiceTitleContainer: {
        alignItems: 'flex-end',
    },
    invoiceTitle: {
        fontSize: scale(22),
        fontWeight: '800',
        color: COLORS.primaryAppColor,
        marginBottom: moderateScale(8),
    },
    invoiceNumberContainer: {
        alignItems: 'center',
    },
    invoiceNumberLabel: {
        fontSize: scale(11),
        color: COLORS.secondaryTextColor,
        marginBottom: moderateScale(2),
    },
    invoiceNumber: {
        fontSize: scale(14),
        fontWeight: '700',
        color: COLORS.secondaryAppColor,
    },
    orderInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: moderateScale(24),
    },
    infoSection: {
        flex: 1,
    },
    sectionLabel: {
        fontSize: scale(14),
        fontWeight: '600',
        color: COLORS.secondaryAppColor,
        marginBottom: moderateScale(8),
        paddingBottom: moderateScale(4),
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderColor,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: moderateScale(6),
    },
    infoLabel: {
        fontSize: scale(12),
        color: COLORS.primaryTextColor,
        width: moderateScale(90),
        fontWeight: '500',
    },
    infoValue: {
        fontSize: scale(12),
        color: COLORS.secondaryTextColor,
        flex: 1,
    },
    infoValueBold: {
        fontSize: scale(13),
        color: COLORS.secondaryAppColor,
        fontWeight: '600',
        marginBottom: moderateScale(2),
    },
    statusBadge: {
        paddingHorizontal: moderateScale(10),
        paddingVertical: moderateScale(4),
        borderRadius: moderateScale(12),
    },
    statusText: {
        fontSize: scale(10),
        color: COLORS.white,
        fontWeight: '600',
    },
    tableContainer: {
        marginBottom: moderateScale(24),
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        borderRadius: moderateScale(8),
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: COLORS.primaryAppColorOpacity(0.1),
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderColor,
        paddingVertical: moderateScale(10),
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderColor,
        paddingVertical: moderateScale(12),
        backgroundColor: COLORS.white,
    },
    tableCell: {
        paddingHorizontal: moderateScale(6),
        justifyContent: 'center',
    },
    serialCell: {
        width: moderateScale(30),
        alignItems: 'center',
    },
    descriptionCell: {
        flex: 2.5,
    },
    qtyCell: {
        width: moderateScale(50),
        alignItems: 'center',
    },
    priceCell: {
        width: moderateScale(60),
        alignItems: 'flex-end',
    },
    taxCell: {
        width: moderateScale(70),
        alignItems: 'center',
    },
    totalCell: {
        width: moderateScale(70),
        alignItems: 'flex-end',
    },
    tableHeaderText: {
        fontSize: scale(11),
        fontWeight: '700',
        color: COLORS.secondaryAppColor,
        textAlign: 'center',
    },
    tableCellText: {
        fontSize: scale(11),
        color: COLORS.secondaryAppColor,
        fontWeight: '500',
    },
    productNameCell: {
        fontSize: scale(11),
        color: COLORS.secondaryAppColor,
        fontWeight: '600',
        marginBottom: moderateScale(2),
    },
    brandCell: {
        fontSize: scale(10),
        color: COLORS.primaryTextColor,
        marginBottom: moderateScale(1),
    },
    variantCell: {
        fontSize: scale(9),
        color: COLORS.secondaryTextColor,
    },
    unitText: {
        fontSize: scale(9),
        color: COLORS.secondaryTextColor,
        marginTop: moderateScale(2),
    },
    taxAmountText: {
        fontSize: scale(9),
        color: COLORS.secondaryTextColor,
        marginTop: moderateScale(2),
    },
    totalCellText: {
        fontSize: scale(12),
        fontWeight: '700',
        color: COLORS.primaryAppColor,
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: moderateScale(24),
        padding: moderateScale(16),
        backgroundColor: COLORS.whiteOpacity(0.8),
        borderRadius: moderateScale(8),
        borderWidth: 1,
        borderColor: COLORS.borderColor,
    },
    summarySection: {
        flex: 1,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: moderateScale(8),
    },
    summaryLabel: {
        fontSize: scale(12),
        color: COLORS.primaryTextColor,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: scale(12),
        color: COLORS.secondaryTextColor,
        fontWeight: '500',
    },
    grandTotalRow: {
        borderTopWidth: 2,
        borderTopColor: COLORS.primaryAppColor,
        paddingTop: moderateScale(10),
        marginTop: moderateScale(6),
    },
    grandTotalLabel: {
        fontSize: scale(14),
        fontWeight: '800',
        color: COLORS.secondaryAppColor,
    },
    grandTotalValue: {
        fontSize: scale(16),
        fontWeight: '800',
        color: COLORS.primaryAppColor,
    },
    paymentInfo: {
        justifyContent: 'flex-end',
        paddingLeft: moderateScale(20),
        borderLeftWidth: 1,
        borderLeftColor: COLORS.borderColor,
    },
    paymentLabel: {
        fontSize: scale(12),
        color: COLORS.primaryTextColor,
        marginBottom: moderateScale(8),
        fontWeight: '500',
    },
    paymentStatus: {
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(6),
        borderRadius: moderateScale(6),
        alignItems: 'center',
    },
    paymentStatusText: {
        fontSize: scale(11),
        fontWeight: '700',
    },
    footer: {
        borderTopWidth: 2,
        borderTopColor: COLORS.borderColor,
        paddingTop: moderateScale(20),
    },
    termsContainer: {
        marginBottom: moderateScale(20),
    },
    termsTitle: {
        fontSize: scale(12),
        fontWeight: '600',
        color: COLORS.secondaryAppColor,
        marginBottom: moderateScale(8),
    },
    termsText: {
        fontSize: scale(10),
        color: COLORS.secondaryTextColor,
        marginBottom: moderateScale(4),
        lineHeight: scale(14),
    },
    signatureContainer: {
        alignItems: 'flex-end',
        marginBottom: moderateScale(20),
    },
    signatureLine: {
        width: moderateScale(150),
        height: 1,
        backgroundColor: COLORS.secondaryAppColor,
        marginBottom: moderateScale(4),
    },
    signatureText: {
        fontSize: scale(10),
        color: COLORS.secondaryTextColor,
        fontStyle: 'italic',
    },
    thankYouContainer: {
        alignItems: 'center',
        paddingVertical: moderateScale(20),
        borderTopWidth: 1,
        borderTopColor: COLORS.borderColor,
    },
    thankYouText: {
        fontSize: scale(14),
        fontWeight: '600',
        color: COLORS.primaryAppColor,
        marginTop: moderateScale(8),
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: moderateScale(40),
    },
    emptyText: {
        fontSize: scale(16),
        color: COLORS.secondaryTextColor,
        marginTop: moderateScale(16),
        textAlign: 'center',
    },
    //  mobileTableContainer: {
    //     marginBottom: moderateScale(20),
    // },
    // mobileItemCard: {
    //     backgroundColor: COLORS.white,
    //     borderRadius: moderateScale(8),
    //     padding: moderateScale(12),
    //     marginBottom: moderateScale(8),
    //     borderWidth: 1,
    //     borderColor: COLORS.borderColor,
    // },
    // mobileRow1: {
    //     flexDirection: 'row',
    //     marginBottom: moderateScale(8),
    // },
    // mobileSerial: {
    //     fontSize: scale(12),
    //     fontWeight: '600',
    //     color: COLORS.primaryAppColor,
    //     marginRight: moderateScale(8),
    // },
    // mobileProductInfo: {
    //     flex: 1,
    // },
    // mobileProductName: {
    //     fontSize: scale(13),
    //     fontWeight: '600',
    //     color: COLORS.secondaryAppColor,
    //     marginBottom: moderateScale(2),
    //     lineHeight: scale(16),
    // },
    // mobileBrand: {
    //     fontSize: scale(11),
    //     color: COLORS.secondaryTextColor,
    // },
    // mobileRow2: {
    //     flexDirection: 'row',
    //     justifyContent: 'space-between',
    //     alignItems: 'center',
    //     paddingTop: moderateScale(8),
    //     borderTopWidth: 1,
    //     borderTopColor: COLORS.borderColorOpacity(0.3),
    // },
    // mobileQuantity: {
    //     backgroundColor: COLORS.primaryAppColorOpacity(0.1),
    //     paddingHorizontal: moderateScale(8),
    //     paddingVertical: moderateScale(4),
    //     borderRadius: moderateScale(4),
    // },
    // mobileQtyText: {
    //     fontSize: scale(11),
    //     fontWeight: '600',
    //     color: COLORS.primaryAppColor,
    // },
    // mobilePriceDetails: {
    //     alignItems: 'center',
    // },
    // mobilePrice: {
    //     fontSize: scale(12),
    //     fontWeight: '600',
    //     color: COLORS.secondaryAppColor,
    //     marginBottom: moderateScale(2),
    // },
    // mobileTax: {
    //     fontSize: scale(9),
    //     color: COLORS.green,
    // },
    // mobileTotal: {
    //     fontSize: scale(14),
    //     fontWeight: '700',
    //     color: COLORS.primaryAppColor,
    // },
})