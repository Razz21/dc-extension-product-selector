import Sdk from 'node-bigcommerce'
import {ProductSelectorError} from '../ProductSelectorError';
import qs from 'qs';

export class BigCommerce {
  constructor({
    logLevel,
    clientId,
    secret,
    callback,
    responseType,
    headers,
    apiVersion
  }) {
    const defaults = {
      logLevel: 'info',
      responseType: 'json',
      headers: { 'Accept-Encoding': '*' }, // Override headers (Overriding the default encoding of GZipped is useful in development)
      apiVersion: 'v3' // Default is v2
    }
    const sdkOptions = {
      ...defaults,
      logLevel,
      clientId,
      secret,
      callback,
      responseType,
      headers,
      apiVersion
    }
    this.bigCommerce = new Sdk(sdkOptions);
    this.PRODUCTS_ENDPOINT = '/catalog/products';
  }

  async getItems(state, filterIds = []) {
    const {
      PAGE_SIZE,
    } = state;
    try {
      if (!filterIds.length){
        return [];
      }
      const idsStrings = filterIds.join(',');

      const queryString = qs.stringify(
        {
          include:"primary_image",
          limit: PAGE_SIZE,
          'id:in': idsStrings
        }
      );

      const response = await this.bigCommerce.get(this.PRODUCTS_ENDPOINT + '?' + queryString)

      return this.parseResults(response.data);

    } catch (e) {
      console.error(e);
      throw new ProductSelectorError('Could not get items', ProductSelectorError.codes.GET_SELECTED_ITEMS);
    }
  }

  getImage({ primary_image = {} }) {
    return primary_image.standard_url || '';
  }

  parseResults(data) {
    return data.map((item) => {
      return {
        id: item.id,
        name: item.name,
        image: this.getImage(item)
      }
    })
  }

  async search(state) {
    const {
      searchText,
      page,
      PAGE_SIZE,
    } = state;

    try {
      const queryString = qs.stringify(
          {
            'keyword:like': searchText,
            include: "primary_image",
            limit: PAGE_SIZE,
            page: page.curPage,
          }
        );

      const response = await this.bigCommerce.get(this.PRODUCTS_ENDPOINT + '?' + queryString);
      const total = response.meta.pagination.total
      return {
        items: this.parseResults(response.data),
        page: {
          numPages: response.meta.pagination.total_pages,
          curPage: page.curPage,
          total
        }
      };
    } catch (e) {
      console.error(e);
      throw new ProductSelectorError('Could not search', ProductSelectorError.codes.GET_ITEMS);
    }
  }

  exportItem(item) {
    return item.id;
  }
}
