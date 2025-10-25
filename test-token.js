#!/usr/bin/env node

/**
 * Script para verificar token de Hugging Face
 * Uso: node test-token.js
 */

require('dotenv').config();

const { HfInference } = require('@huggingface/inference');

async function testToken() {
  console.log('🔍 Verificando configuración de Hugging Face\n');
  
  const token = process.env.HUGGINGFACE_API_KEY;
  
  console.log('📋 Estado del Token:');
  console.log('  - Configurado:', token ? '✅ Sí' : '❌ No');
  
  if (!token) {
    console.log('\n❌ ERROR: No se encontró HUGGINGFACE_API_KEY en el archivo .env');
    console.log('\n📝 Pasos para configurar:');
    console.log('  1. Crea el archivo .env en la raíz del proyecto');
    console.log('  2. Agrega: HUGGINGFACE_API_KEY=hf_tu_token_aqui');
    console.log('  3. Obtén tu token en: https://huggingface.co/settings/tokens\n');
    process.exit(1);
  }
  
  console.log('  - Formato:', token.startsWith('hf_') ? '✅ Correcto (hf_...)' : '⚠️ Inusual (debería empezar con hf_)');
  console.log('  - Longitud:', token.length, 'caracteres');
  console.log('  - Primeros 10 chars:', token.substring(0, 10) + '...');
  
  console.log('\n🧪 Probando conexión con Hugging Face...\n');
  
  try {
    const hf = new HfInference(token);
    
    // Test simple: verificar que el token funciona
    console.log('  ⏳ Verificando token con Hugging Face API...');
    
    // Intentar listar modelos (solo verifica autenticación)
    const axios = require('axios');
    const response = await axios.get('https://huggingface.co/api/whoami-v2', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('  ✅ Token válido!');
    console.log('  � Usuario:', response.data.name || 'Anónimo');
    console.log('  📧 Email:', response.data.email ? response.data.email.substring(0, 3) + '***' : 'No disponible');
    
    console.log('\n✨ ¡Token verificado exitosamente!\n');
    console.log('📌 Próximo paso: Sube un archivo de audio en http://localhost:3000\n');
    console.log('💡 El modelo usará: openai/whisper-large-v3 (gratis, sin límites en HF)\n');
    
  } catch (error) {
    console.log('  ❌ Error al conectar\n');
    console.error('📋 Detalles del error:');
    console.error('  - Mensaje:', error.message);
    
    if (error.response) {
      console.error('  - Status:', error.response.status);
      console.error('  - Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.log('\n🔍 Posibles causas:');
    
    if (error.message.includes('401') || error.message.includes('Invalid')) {
      console.log('  • Token inválido o expirado');
      console.log('  • Verifica que copiaste el token completo');
      console.log('  • Genera un nuevo token en: https://huggingface.co/settings/tokens');
    } else if (error.message.includes('429')) {
      console.log('  • Límite de uso alcanzado temporalmente');
      console.log('  • Espera unos minutos e intenta de nuevo');
    } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
      console.log('  • Problema de conexión a internet');
      console.log('  • Verifica tu conexión de red');
    } else {
      console.log('  • Error desconocido');
      console.log('  • Revisa los detalles arriba');
    }
    
    console.log('');
    process.exit(1);
  }
}

testToken();
