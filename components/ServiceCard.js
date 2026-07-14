import { Image, StyleSheet, Text, View } from 'react-native'

const ServiceCard = ({ imageSource, title }) => {
    return (
        <View style={styles.container}>
            <Image 
                source={{ uri: imageSource }}  
                style={styles.image}
            />
            <Text style={styles.text}>{title}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: 104,       
        height: 104,       
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    image: {
        width: '100%',
        height: '66%',    
        resizeMode: 'cover',
    },
    text: {
        height: '34%',     
        paddingHorizontal: 8,
        paddingVertical: 2,
        fontSize: 12,
        fontWeight: '600',
        color: '#1A1A1A',
        textAlign: 'center',
    }
})

export default ServiceCard