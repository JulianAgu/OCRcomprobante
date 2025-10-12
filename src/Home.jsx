import { 
    Box, 
    Typography, 
    Card, 
    CardContent, 
    Grid, 
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import { 
    DocumentScanner, 
    AttachMoney, 
    CalendarToday, 
    Person, 
    CreditCard,
    Numbers,
    History,
    CloudUpload
} from '@mui/icons-material';

const Home = () => {
    const features = [
        {
            icon: <DocumentScanner color="primary" />,
            title: "Reconocimiento OCR",
            description: "Extrae texto automáticamente de imágenes y documentos PDF con alta precisión"
        },
        {
            icon: <Person color="primary" />,
            title: "Detección de Nombres",
            description: "Identifica nombres de personas en comprobantes de MercadoPago y otros bancos"
        },
        {
            icon: <AttachMoney color="primary" />,
            title: "Extracción de Montos",
            description: "Detecta cantidades de dinero con filtrado inteligente para evitar falsos positivos"
        },
        {
            icon: <CalendarToday color="primary" />,
            title: "Reconocimiento de Fechas",
            description: "Identifica fechas en múltiples formatos españoles, incluyendo días de semana"
        },
        {
            icon: <CreditCard color="primary" />,
            title: "Datos Bancarios",
            description: "Extrae CUIT/CUIL, CVU/CBU y otros datos bancarios relevantes"
        },
        {
            icon: <History color="primary" />,
            title: "Historial Completo",
            description: "Guarda automáticamente todos los comprobantes procesados para consulta posterior"
        },
    ];

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
            {/* Bienvenida */}
            <Paper elevation={3} sx={{ p: 4, mb: 4, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    ¡Bienvenida Julieta!
                </Typography>
                <Typography variant="h6" sx={{ mt: 2, opacity: 0.9 }}>
                    Procesa comprobantes de forma automática y extrae información valiosa
                </Typography>
            </Paper>

            {/* Descripción principal */}
            <Card elevation={2} sx={{ mb: 4 }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h5" component="h2" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                        ¿Qué hace este sistema?
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                        Nuestro sistema de <strong>Reconocimiento Óptico de Caracteres (OCR)</strong> está diseñado 
                        específicamente para procesar comprobantes bancarios y extractos de transferencias. 
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                        Simplemente sube tu comprobante y el sistema se encargará del resto, identificando nombres, 
                        montos, fechas y otros datos importantes de forma precisa y rápida.
                    </Typography>
                </CardContent>
            </Card>

            {/* Funcionalidades */}
            <Typography variant="h5" component="h2" gutterBottom color="primary" sx={{ fontWeight: 'bold', mb: 3 }}>
                Funcionalidades Principales
            </Typography>
            
            <Grid container spacing={3}>
                {features.map((feature, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card elevation={2} sx={{ height: '100%', '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s' } }}>
                            <CardContent sx={{ textAlign: 'center', p: 3 }}>
                                <Box sx={{ mb: 2 }}>
                                    {feature.icon}
                                </Box>
                                <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    {feature.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {feature.description}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Instrucciones de uso */}
            <Card elevation={2} sx={{ mt: 4 }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h5" component="h2" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                        Cómo usar el sistema
                    </Typography>
                    <List>
                        <ListItem>
                            <ListItemIcon>
                                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>1.</Typography>
                            </ListItemIcon>
                            <ListItemText 
                                primary="Ir a la sección OCR" 
                                secondary="Navega a la sección 'OCR' desde el menú lateral"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>2.</Typography>
                            </ListItemIcon>
                            <ListItemText 
                                primary="Subir tu comprobante" 
                                secondary="Haz clic en 'Subir comprobante' y selecciona tu imagen o PDF"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>3.</Typography>
                            </ListItemIcon>
                            <ListItemText 
                                primary="Esperar el procesamiento" 
                                secondary="El sistema procesará automáticamente tu documento"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>4.</Typography>
                            </ListItemIcon>
                            <ListItemText 
                                primary="Revisar los resultados" 
                                secondary="Verifica la información extraída y consulta el historial cuando lo necesites"
                            />
                        </ListItem>
                    </List>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Home;