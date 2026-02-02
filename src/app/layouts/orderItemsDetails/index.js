import {
    StyleSheet,
    View,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import React, { useCallback, useState } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import FastImage from '@d11/react-native-fast-image';

import Icon from '../../../utils/icon';
import TextComp from '../../components/textComp';
import Wrapper from '../../components/wrapper';
import { COLORS } from '../../../res/colors';

// ✅ size-matters import
import {
    scale,
    verticalScale,
    moderateScale,
} from 'react-native-size-matters';
import { SCREEN } from '..';

const OrderItemDetails = () => {
    const navigation = useNavigation();
    const params = useRoute().params || {};
    const [order] = useState(params.order || null);

    const getStatusColor = status => {
        switch (status) {
            case 'pending':
                return COLORS.yellow;
            case 'confirmed':
                return COLORS.blue;
            case 'shipped':
                return COLORS.primaryAppColor;
            case 'delivered':
                return COLORS.green;
            case 'cancelled':
                return COLORS.red;
            default:
                return COLORS.secondaryTextColor;
        }
    };

    const navigateToInvoice = () => {
        console.log('i am here')
        navigation.navigate(SCREEN.INVOICE, {
            billInfo: {
                orderDetails: order,
                items: order.items,
                summary: order.order_summary,
                userDetails: order.user_details,
            },
        });
    };

    const renderOrderItem = (item, index, paymentType) => {
        console.log('paymentType', paymentType)
        return (
            <View style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                    <View style={styles.imageContainer}>
                        <FastImage
                            source={{ uri: item.display_image }}
                            style={styles.productImage}
                            resizeMode={FastImage.resizeMode.contain}
                        />
                    </View>

                    <View style={styles.itemInfo}>
                        <TextComp style={styles.productName}>
                            {item.product_name}
                        </TextComp>
                        <TextComp style={styles.brandName}>
                            {item.brand_name}
                        </TextComp>

                        {!!item.variant_size && (
                            <TextComp style={styles.variantText}>
                                Size: {item.variant_size}
                            </TextComp>
                        )}

                        <TextComp style={styles.quantityText}>
                            Qty: {item.quantity} {item.unit}
                        </TextComp>
                    </View>
                </View>

                <View style={styles.priceContainer}>
                    <View style={styles.priceRow}>
                        <TextComp style={styles.priceLabel}>Price:</TextComp>
                        {paymentType === 'credit' ? (
                            <View style={{ alignItems: 'center', flexDirection: 'row' }}>
                                <TextComp style={[styles.finalPrice, {
                                    color: COLORS.black,
                                }]}>
                                    ₹{item.original_price.toFixed(2)}

                                </TextComp>

                            </View>
                        ) : (
                            <View style={{ alignItems: 'center', flexDirection: 'row' }}>
                                <TextComp style={[styles.finalPrice, {
                                    textDecorationLine: 'line-through',
                                }]}>
                                    ₹{item.original_price.toFixed(2)}

                                </TextComp>
                                <TextComp style={[styles.finalPrice, { color: COLORS.green, }]}>{'    '}₹{item.final_price.toFixed(2)}</TextComp>

                            </View>
                        )}
                        {/* {item.mrp > 0 && (
                            <TextComp style={styles.mrpPrice}>
                                ₹{item.mrp.toFixed(2)}
                            </TextComp>
                        )} */}
                    </View>

                    <View style={styles.priceRow}>
                        <TextComp style={styles.priceLabel}>Subtotal:</TextComp>
                        <TextComp style={styles.subtotal}>
                            ₹{item.item_subtotal.toFixed(2)}
                        </TextComp>
                    </View>

                    <View style={styles.priceRow}>
                        <TextComp style={styles.priceLabel}>
                            Tax ({item.tax_percent}%):
                        </TextComp>
                        <TextComp style={styles.taxAmount}>
                            ₹{item.tax_amount.toFixed(2)}
                        </TextComp>
                    </View>

                    <View style={[styles.priceRow, styles.totalRow]}>
                        <TextComp style={styles.totalLabel}>Total:</TextComp>
                        <TextComp style={styles.itemTotal}>
                            ₹{item.item_total.toFixed(2)}
                        </TextComp>
                    </View>

                    {item.discount_amount !== 0 && (
                        <View style={styles.savingsContainer}>
                            <Icon
                                name="tag"
                                type="Feather"
                                size={scale(12)}
                                color={item.discount_amount > 0 ? COLORS.green : COLORS.red}
                            />
                            <TextComp
                                style={[
                                    styles.savingsText,
                                    {
                                        color:
                                            item.discount_amount > 0 ? COLORS.green : COLORS.red,
                                    },
                                ]}>
                                {item.discount_amount > 0 ? 'Saved' : 'Extra'}: ₹
                                {Math.abs(item?.discount_amount || 0).toFixed(2)}{'  '}
                                {'('}{Number(item?.total_discount_percent || 0).toFixed(2)}{'%)'}
                            </TextComp>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderUserDetails = () => (
        <View style={styles.userContainer}>
            <View style={styles.sectionHeader}>
                <Icon
                    name="person"
                    type="MaterialIcons"
                    size={scale(18)}
                    color={COLORS.primaryTextColor}
                />
                <TextComp style={styles.sectionTitle}>
                    Customer Details
                </TextComp>
            </View>

            <View style={styles.detailRow}>
                <TextComp style={styles.detailLabel}>Name:</TextComp>
                <TextComp style={styles.detailValue}>
                    {order.user_details.name}
                </TextComp>
            </View>

            <View style={styles.detailRow}>
                <TextComp style={styles.detailLabel}>Business:</TextComp>
                <TextComp style={styles.detailValue}>
                    {order.user_details.business_name}
                </TextComp>
            </View>

            <View style={styles.detailRow}>
                <TextComp style={styles.detailLabel}>GST:</TextComp>
                <TextComp style={styles.detailValue}>
                    {order.user_details.gst_number}
                </TextComp>
            </View>

            <View style={styles.detailRow}>
                <TextComp style={styles.detailLabel}>Address:</TextComp>
                <TextComp style={styles.detailValue}>
                    {order.user_details.address},{' '}
                    {order.user_details.city},{' '}
                    {order.user_details.state} -{' '}
                    {order.user_details.postal_code}
                </TextComp>
            </View>
        </View>
    );

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.orderHeader}>
                <View>
                    <TextComp style={styles.orderId}>
                        Order #{order.order_number}
                    </TextComp>
                    <TextComp style={styles.orderDate}>
                        {order.order_date} •{' '}
                        {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                    </TextComp>
                </View>

                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(order.status) },
                    ]}>
                    <TextComp style={styles.statusText}>
                        {order.status.toUpperCase()}
                    </TextComp>
                </View>
            </View>

            {renderUserDetails()}
        </View>
    );

    if (!order) {
        return (
            <Wrapper>
                <View style={styles.emptyContainer}>
                    <Icon
                        name="error-outline"
                        type="MaterialIcons"
                        size={scale(60)}
                        color={COLORS.secondaryTextColor}
                    />
                    <TextComp style={styles.emptyText}>
                        No order details available
                    </TextComp>
                </View>
            </Wrapper>
        );
    }

    const renderItem = useCallback(
        ({ item, index }) => renderOrderItem(item, index, order?.payment_type),
        [order?.payment_type]
    );


    return (
        <Wrapper>
            <FlatList
                data={order.items}
                renderItem={renderItem}
                keyExtractor={(item, index,) =>
                    `${item.product_id}-${item.variant_id || index}`
                }
                ListHeaderComponent={renderHeader}
                ListFooterComponent={
                    <>
                        <View style={styles.summaryContainer}>
                            <View style={styles.sectionHeader}>
                                <Icon
                                    name="receipt"
                                    type="MaterialIcons"
                                    size={scale(18)}
                                    color={COLORS.primaryTextColor}
                                />
                                <TextComp style={styles.sectionTitle}>
                                    Order Summary
                                </TextComp>
                            </View>

                            <View style={styles.summaryRow}>
                                <TextComp style={styles.summaryLabel}>
                                    Subtotal
                                </TextComp>
                                <TextComp style={styles.summaryValue}>
                                    ₹
                                    {order.order_summary.subtotal.toFixed(2)}
                                </TextComp>
                            </View>

                            <View style={styles.summaryRow}>
                                <TextComp style={styles.summaryLabel}>
                                    Tax ({order.order_summary.tax_type})
                                </TextComp>
                                <TextComp style={styles.summaryValue}>
                                    ₹
                                    {order.order_summary.total_tax.toFixed(2)}
                                </TextComp>
                            </View>

                            <View style={styles.grandTotalRow}>
                                <TextComp style={styles.grandTotalLabel}>
                                    Grand Total
                                </TextComp>
                                <TextComp style={styles.grandTotalValue}>
                                    ₹
                                    {order.order_summary.grand_total.toFixed(2)}
                                </TextComp>
                            </View>
                        </View>

                        {/* {order.can_cancel !== false && (
                            <TouchableOpacity
                                style={styles.invoiceButton}
                                onPress={navigateToInvoice}
                                activeOpacity={0.8}>
                                <Icon
                                    name="file-invoice-dollar"
                                    type="FontAwesome6"
                                    size={scale(18)}
                                    color={COLORS.white}
                                />
                                <TextComp style={styles.invoiceButtonText}>
                                    View Invoice
                                </TextComp>
                            </TouchableOpacity>
                        )} */}


                        <View style={styles.bottomSpacing} />
                    </>
                }
                showsVerticalScrollIndicator={false}
            />
        </Wrapper>
    );
};


export default OrderItemDetails;

const styles = StyleSheet.create({
    listContainer: {
        paddingBottom: moderateScale(20),
    },
    header: {
        paddingBottom: moderateScale(16),
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderColor,
        marginBottom: moderateScale(12),
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: moderateScale(16),
    },
    orderId: {
        fontSize: scale(18),
        fontWeight: '600',
        color: COLORS.secondaryAppColor,
        marginBottom: moderateScale(4),
    },
    orderDate: {
        fontSize: scale(13),
        color: COLORS.secondaryTextColor,
    },
    statusBadge: {
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(6),
        borderRadius: moderateScale(20),
    },
    statusText: {
        fontSize: scale(11),
        color: COLORS.white,
        fontWeight: '500',
    },
    userContainer: {
        backgroundColor: COLORS.whiteOpacity(0.8),
        borderRadius: moderateScale(12),
        padding: moderateScale(12),
        borderWidth: 1,
        borderColor: COLORS.borderColor,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: moderateScale(12),
    },
    sectionTitle: {
        fontSize: scale(16),
        fontWeight: '600',
        color: COLORS.secondaryAppColor,
        marginLeft: moderateScale(8),
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: moderateScale(6),
    },
    detailLabel: {
        fontSize: scale(13),
        color: COLORS.primaryTextColor,
        width: moderateScale(80),
        fontWeight: '500',
    },
    detailValue: {
        fontSize: scale(13),
        color: COLORS.secondaryTextColor,
        flex: 1,
    },
    itemContainer: {
        backgroundColor: COLORS.white,
        borderRadius: moderateScale(12),
        padding: moderateScale(12),
        marginBottom: moderateScale(12),
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    itemHeader: {
        flexDirection: 'row',
        marginBottom: moderateScale(12),
    },
    imageContainer: {
        width: moderateScale(80),
        height: moderateScale(80),
        backgroundColor: COLORS.white,
        borderRadius: moderateScale(8),
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    itemInfo: {
        flex: 1,
        marginLeft: moderateScale(12),
        justifyContent: 'space-between',
    },
    productName: {
        fontSize: scale(14),
        fontWeight: '600',
        color: COLORS.secondaryAppColor,
        marginBottom: moderateScale(4),
    },
    brandName: {
        fontSize: scale(12),
        color: COLORS.primaryTextColor,
        marginBottom: moderateScale(2),
    },
    variantText: {
        fontSize: scale(12),
        color: COLORS.secondaryTextColor,
        marginBottom: moderateScale(2),
    },
    quantityText: {
        fontSize: scale(12),
        color: COLORS.primaryAppColor,
        fontWeight: '500',
    },
    priceContainer: {
        backgroundColor: COLORS.whiteOpacity(0.9),
        borderRadius: moderateScale(8),
        padding: moderateScale(10),
        borderWidth: 1,
        borderColor: COLORS.borderColor,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: moderateScale(6),
    },
    priceLabel: {
        fontSize: scale(12),
        color: COLORS.primaryTextColor,
    },
    finalPrice: {
        fontSize: scale(12),
        fontWeight: '500',
        color: COLORS.red,

    },
    mrpPrice: {
        fontSize: scale(11),
        color: COLORS.secondaryTextColor,
        textDecorationLine: 'line-through',
        marginLeft: moderateScale(4),
    },
    subtotal: {
        fontSize: scale(12),
        fontWeight: '600',
        color: COLORS.secondaryAppColor,
    },
    taxAmount: {
        fontSize: scale(12),
        color: COLORS.secondaryTextColor,
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: COLORS.borderColor,
        paddingTop: moderateScale(8),
        marginTop: moderateScale(4),
    },
    totalLabel: {
        fontSize: scale(13),
        fontWeight: '600',
        color: COLORS.secondaryAppColor,
    },
    itemTotal: {
        fontSize: scale(14),
        fontWeight: '700',
        color: COLORS.primaryAppColor,
    },
    savingsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: moderateScale(8),
        paddingTop: moderateScale(8),
        borderTopWidth: 1,
        borderTopColor: COLORS.borderColor,
    },
    savingsText: {
        fontSize: scale(12),
        fontWeight: '500',
        marginLeft: moderateScale(4),
    },
    summaryContainer: {
        backgroundColor: COLORS.white,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        marginBottom: moderateScale(12),
        borderWidth: 1,
        borderColor: COLORS.borderColor,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: moderateScale(8),
    },
    summaryLabel: {
        fontSize: scale(13),
        color: COLORS.primaryTextColor,
    },
    summaryValue: {
        fontSize: scale(13),
        color: COLORS.secondaryTextColor,
        fontWeight: '500',
    },
    grandTotalRow: {
        borderTopWidth: 1,
        borderTopColor: COLORS.borderColor,
        paddingTop: moderateScale(12),
        marginTop: moderateScale(4),
    },
    grandTotalLabel: {
        fontSize: scale(15),
        fontWeight: '700',
        color: COLORS.secondaryAppColor,
    },
    grandTotalValue: {
        fontSize: scale(18),
        fontWeight: '700',
        color: COLORS.primaryAppColor,
    },
    invoiceButton: {
        backgroundColor: COLORS.primaryAppColor,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: moderateScale(14),
        borderRadius: moderateScale(10),
        marginTop: moderateScale(8),
        marginBottom: moderateScale(20),
    },
    invoiceButtonText: {
        color: COLORS.white,
        fontSize: scale(15),
        fontWeight: '600',
        marginLeft: moderateScale(8),
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: scale(16),
        color: COLORS.secondaryTextColor,
        marginTop: moderateScale(12),
    },
    bottomSpacing: {
        height: moderateScale(80),
    },
});